#!/usr/bin/env node
// archive-timer.mjs — 方案 B 唤醒执行器（到点归档检测 → 落 pending 队列 → 唤醒后清理）
// 用法:
//   node scripts/archive-timer.mjs --due            # 发现静默未 mark 会话（自动建 mark）+ 扫描 mark：fireAt 到点 → 门控 → 机械召回 → 落 audit/archive-pending/<sid>.json → pending=true/fireAt=null
//   node scripts/archive-timer.mjs --watch [ms]     # 周期常驻执行 --due（缺省 60s；插件 daemon-loop 每 tick 调 --due，本模式供 CLI 独立跑）
//   node scripts/archive-timer.mjs --status [--json]
//   node scripts/archive-timer.mjs --pending-list [--json]   # pending 队列清单（裁决入口）
//   node scripts/archive-timer.mjs --dequeue <sessionId>     # 裁决完成后清理该会话队列文件（与 --pending-list 配对）
// env: ARCHIVE_LOG / ARCHIVE_PENDING / ARCHIVE_SESSIONS / ARCHIVE_SILENT_MS / ARCHIVE_MIN_LINES（资格门控，缺省 50）
//      ARCHIVE_DISCOVER=0 关闭发现步 / ARCHIVE_DISCOVER_BATCH 每 tick 发现上限（缺省 3，最旧优先）
// 活跃保护：fireAt 到点但转录 mtime 仍新鲜（<静默阈值）→ rearm 重计时（忘 touch 的活跃会话不误触发，touch 降级为可选优化）
// 数据驱动重武装：fireAt=null + 已静默 + 转录 size 变化（mark 记录 lastSize）→ 重新武装（重启重计时兜底）
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as lib from './archive-lib.mjs';

const argv = process.argv.slice(2);
const wantJson = argv.includes('--json');
const mode = argv.includes('--due') ? 'due' : argv.includes('--watch') ? 'watch' : argv.includes('--status') ? 'status' : argv.includes('--pending-list') ? 'plist' : argv.includes('--dequeue') ? 'deq' : null;
if (!mode) { console.error('用法: node scripts/archive-timer.mjs --due | --watch [ms] | --status [--json] | --pending-list [--json] | --dequeue <sessionId>'); process.exit(3); }

const cfg = lib.pathConfig();
const minLines = () => Number(process.env.ARCHIVE_MIN_LINES) || 50;
const discoverBatch = () => Number(process.env.ARCHIVE_DISCOVER_BATCH) || 3; // 每 tick 最多发现的未 mark 会话数（摊平成本）
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 发现步（补「无 mark 会话脱管」缺口）：静默超阈值的未 mark 会话 → 自动建 mark（下轮 tick 正常走门控/入队）----
// 资格：转录 mtime 已静默超 silentMs；跳过 ARCHIVE_DISCOVER 空目录（测试/工具自检）
async function discoverSessions(marks) {
  if (String(process.env.ARCHIVE_DISCOVER) === '0') return [];
  const now = Date.now();
  const cands = (await lib.enumerateSessions(now - cfg.silentMs, marks)).slice(0, discoverBatch());
  const discovered = [];
  for (const c of cands) {
    await lib.upsertMark({ sessionId: c.sessionId, lastRow: 0, done: false, pending: false, lastTurnAt: c.mtime, fireAt: now, at: new Date().toISOString() });
    discovered.push({ sid: c.sessionId, action: 'discovered', reason: `无 mark 且已静默（mtime ${new Date(c.mtime).toISOString()}）→ 建 mark 立即到点` });
  }
  return discovered;
}

// ---- 核心扫描：发现 → fireAt 到点 → 触发/清理/重武装（幂等：已入队或已清理不再触发）----
async function runDue() {
  let marks = await lib.readMarks(cfg.log);
  const fired = await discoverSessions(marks);
  if (fired.length) marks = await lib.readMarks(cfg.log); // 发现新建了 mark → 重读，本轮即处理
  const now = Date.now(); // 发现步之后采样：新建 mark 的 fireAt(=发现时刻) 必然 ≤ now，同轮即处理
  for (const m of marks) {
    const sid = m.sessionId;

    // ── 数据驱动重武装：fireAt=null（已被清理）+ 已静默 + 转录 size 变化（新行/继续）→ 重新武装（重启重计时兜底）──
    if (m.fireAt == null && !m.pending) {
      const tfile = await lib.locateTranscript(sid);
      if (tfile) {
        const fp = await lib.statFile(tfile);
        const changed = fp && m.lastSize != null && fp.size !== m.lastSize;
        const silent = !fp || fp.mtime <= now - cfg.silentMs;
        if (changed && silent) {
          await lib.upsertMark({ ...m, fireAt: now, lastTurnAt: fp.mtime, at: new Date().toISOString() });
          fired.push({ sid, action: 'rearm', reason: `fireAt=null 但转录已变化且静默（size ${m.lastSize}→${fp.size}）→ 数据驱动重武装` });
          continue;
        }
      }
      continue; // fireAt=null 且无重武装证据：保持清理态（幂等）
    }

    if (m.fireAt == null || m.fireAt > now) continue; // 未武装/未到点
    if (m.pending && (await lib.readPending(sid, cfg.pendingDir))) continue; // 已入队待裁决（幂等）
    const file = await lib.locateTranscript(sid);
    if (!file) { fired.push({ sid, action: 'skip', reason: '转录未找到' }); continue; }

    // ── 活跃保护：转录 mtime 新鲜 = 机器可测的活跃证据（忘 touch 的活跃会话不误触发）──
    const fp = await lib.statFile(file);
    if (fp && fp.mtime > now - cfg.silentMs) {
      await lib.upsertMark({ ...m, fireAt: now + cfg.silentMs, lastTurnAt: fp.mtime, at: new Date().toISOString() });
      fired.push({ sid, action: 'rearm', reason: `转录仍活跃（mtime ${new Date(fp.mtime).toISOString()}）→ 重计时（活跃保护）` });
      continue;
    }

    let text = '';
    try { text = await lib.decodeTranscript(file); } catch (e) { fired.push({ sid, action: 'skip', reason: '解码失败: ' + e.message }); continue; }
    const total = lib.countLines(text);
    if (total <= m.lastRow) {
      // 无增量：唤醒后清理 fireAt（防重复触发）；done 保持——size 已记录，后续变化走数据驱动重武装
      await lib.upsertMark({ ...m, fireAt: null, lastSize: fp ? fp.size : m.lastSize, at: new Date().toISOString() });
      fired.push({ sid, action: 'clear', reason: `无增量 (lastRow=${m.lastRow}, total=${total})` });
      continue;
    }
    if (total < minLines()) {
      // 资格不够：重新计时（窗口重来）
      await lib.upsertMark({ ...m, fireAt: now + cfg.silentMs, lastTurnAt: fp.mtime, at: new Date().toISOString() });
      fired.push({ sid, action: 'rearm', reason: `行数 ${total} < ${minLines()}，重新计时` });
      continue;
    }
    const signals = lib.recallSignals(text.split('\n').filter(Boolean), m.lastRow + 1);
    const payload = { dueAt: new Date().toISOString(), lastRow: m.lastRow, total, delta: total - m.lastRow, done: !!m.done, signals, transcript: file };
    await lib.writePending(sid, payload, cfg.pendingDir);
    await lib.upsertMark({ ...m, pending: true, fireAt: null, lastSize: fp ? fp.size : m.lastSize, at: new Date().toISOString() }); // 唤醒后清理
    fired.push({ sid, action: 'fired', delta: payload.delta, signals: signals.length, queue: lib.pendingFileFor(sid, cfg.pendingDir) });
  }
  return fired;
}

if (mode === 'due') {
  const fired = await runDue();
  if (wantJson) console.log(JSON.stringify({ count: fired.length, fired }, null, 2));
  else if (fired.length) fired.forEach((f) => console.log(`${f.action === 'fired' ? '⏰' : '·'} ${f.sid} ${f.action}${f.reason ? ' — ' + f.reason : ''}${f.action === 'fired' ? `（增量 ${f.delta} 行，信号 ${f.signals} 条 → ${f.queue}）` : ''}`));
  else console.log('无到点会话');
  process.exit(0);
}

if (mode === 'watch') {
  const idx = argv.indexOf('--watch');
  const interval = Number(argv[idx + 1]) || Number(process.env.ARCHIVE_WATCH_MS) || 60000;
  console.log(`archive-timer --watch：每 ${interval}ms 扫描一次（Ctrl+C 退出）`);
  for (;;) {
    const fired = await runDue().catch((e) => [{ sid: '-', action: 'error', reason: e.message }]);
    fired.forEach((f) => console.log(`[${new Date().toISOString()}] ${f.sid} ${f.action}${f.reason ? ' — ' + f.reason : ''}`));
    await sleep(interval);
  }
}

if (mode === 'status') {
  const marks = await lib.readMarks(cfg.log);
  const now = Date.now();
  const rows = marks.map((m) => ({
    sessionId: m.sessionId, lastRow: m.lastRow ?? 0, done: !!m.done, pending: !!m.pending,
    fireAt: m.fireAt ?? null, dueInMs: m.fireAt != null ? Math.max(0, m.fireAt - now) : null,
  }));
  if (wantJson) console.log(JSON.stringify(rows, null, 2));
  else {
    console.log('sessionId | lastRow | done | pending | fireAt | 剩余');
    for (const r of rows) console.log(`${r.sessionId} | ${r.lastRow} | ${r.done ? '✓' : '·'} | ${r.pending ? '📥' : '·'} | ${r.fireAt ? new Date(r.fireAt).toISOString() : '—'} | ${r.dueInMs != null ? Math.round(r.dueInMs / 1000) + 's' : '—'}`);
    if (!rows.length) console.log('（无 mark）');
  }
  process.exit(0);
}

if (mode === 'deq') {
  const sid = argv.filter((a) => !a.startsWith('--'))[0];
  if (!sid) { console.error('用法: --dequeue <sessionId>'); process.exit(3); }
  await lib.removePending(sid, cfg.pendingDir);
  const m = await lib.findMark(sid);
  if (m) await lib.upsertMark({ ...m, pending: false, at: new Date().toISOString() });
  console.log(`dequeue ${lib.normalizeSid(sid)}: 队列文件已清理，mark pending 已复位`);
  process.exit(0);
}

if (mode === 'plist') {
  const files = await lib.listPending(cfg.pendingDir);
  const rows = [];
  for (const f of files) { try { rows.push(JSON.parse(await readFile(join(cfg.pendingDir, f), 'utf8'))); } catch { /* 坏行跳过 */ } }
  if (wantJson) console.log(JSON.stringify(rows, null, 2));
  else {
    console.log(`pending 队列 ${rows.length} 条：`);
    rows.forEach((r) => console.log(`- ${r.sessionId}（增量 ${r.delta} 行，信号 ${(r.signals || []).length} 条，due ${r.dueAt}）`));
  }
  process.exit(0);
}
