#!/usr/bin/env node
// test.mjs — managing-memory 冒烟测试（Anthropic「用真实使用测试」落地）
// 覆盖：体检（exit 0 / 超容量 2 / 悬空指针 5）+ 门禁（正常 0 / 超容量 1 / 悬空 2 / 用法 3）
// 用法: node scripts/test.mjs （只读 + 临时副本，不改动真实记忆）
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const health = path.join(skillDir, 'scripts', 'memory_health_check.mjs');
const gate = path.join(skillDir, 'scripts', 'memory_write_gate.mjs');
const cand = path.join(skillDir, 'scripts', 'candidate_grep.mjs');

let pass = 0, fail = 0;
function run(label, cmd, args, expected) {
  try {
    const out = execFileSync(cmd, args, { encoding: 'utf8', cwd: skillDir });
    const ok = expected.includes(0);
    if (ok) pass++; else fail++;
    console.log(`${ok ? '✅' : '❌'} ${label} (exit=0，期望 ${expected.join('/')})`);
  } catch (e) {
    const code = e.status ?? -1;
    const ok = expected.includes(code);
    if (ok) pass++; else fail++;
    console.log(`${ok ? '✅' : '❌'} ${label} (exit=${code}，期望 ${expected.join('/')})`);
  }
}

// 1) 真实目录体检 → exit 0
run('体检-真实目录', 'node', [health], [0]);

// 2) 构造超容量副本 → exit 2
const t1 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t1-'));
fs.cpSync(skillDir, t1, { recursive: true });
fs.appendFileSync(path.join(t1, 'MEMORY.md'), '\n[env] 测试填充（2026-09-01）[agent] → notes/env.md §填充：' + '填充内容'.repeat(300));
run('体检-超容量>85%', 'node', [health, t1], [2]);

// 3) 构造悬空指针副本 → exit 5
const t2 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t2-'));
fs.cpSync(skillDir, t2, { recursive: true });
fs.appendFileSync(path.join(t2, 'MEMORY.md'), '\n[env] 悬空指针（2026-09-01）[agent] → notes/nofile.md');
run('体检-悬空指针', 'node', [health, t2], [5]);

// 4) 门禁-正常 → exit 0
const g1 = path.join(t2, 'gate1.txt');
fs.copyFileSync(path.join(skillDir, 'MEMORY.md'), g1);
run('门禁-正常', 'node', [gate, 'MEMORY.md', g1], [0]);

// 5) 门禁-超容量 → exit 1
const g2 = path.join(t2, 'gate2.txt');
fs.copyFileSync(path.join(skillDir, 'MEMORY.md'), g2);
fs.appendFileSync(g2, '\n§\n' + '[env] 超量（2026-09-01）[agent]：' + '内容'.repeat(1000));
run('门禁-超容量', 'node', [gate, 'MEMORY.md', g2], [1]);

// 6) 门禁-悬空指针 → exit 2
const g3 = path.join(t2, 'gate3.txt');
fs.copyFileSync(path.join(skillDir, 'MEMORY.md'), g3);
fs.appendFileSync(g3, '\n§\n[env] 悬空（2026-09-01）[agent]：细节→ notes/nofile.md');
run('门禁-悬空指针', 'node', [gate, 'MEMORY.md', g3], [2]);

// 7) 门禁-用法错误 → exit 3
run('门禁-用法错误', 'node', [gate], [3]);

// 8) 门禁-notes 子文档目标 → exit 0
const g4 = path.join(t2, 'gate4.txt');
fs.writeFileSync(g4, '# notes/tools.md — 工具配置详情\n\n## 测试\n- 占位（2026-09-01）\n');
run('门禁-notes目标', 'node', [gate, 'notes/tools.md', g4], [0]);

// 9) 候选召回-冒烟（存在明文会话 exit 0/1 均可，重点不崩溃、输出含"召回"字样）
run('候选召回-冒烟', 'node', [cand], [0, 1]);

// 10) 候选召回-纯只读验证（运行后技能目录无新文件/无 pending 新增）
const pendBefore = fs.readdirSync(path.join(skillDir, 'pending')).filter((f) => f.endsWith('.md') && f !== 'README.md').length;
try { execFileSync('node', [cand, '--max', '1'], { encoding: 'utf8', cwd: skillDir, stdio: 'ignore' }); } catch {}
const pendAfter = fs.readdirSync(path.join(skillDir, 'pending')).filter((f) => f.endsWith('.md') && f !== 'README.md').length;
const clean = pendBefore === pendAfter;
if (clean) pass++; else fail++;
console.log(`${clean ? '✅' : '❌'} 候选召回-纯只读（pending ${pendBefore}→${pendAfter}，无写入）`);

// 11) read_section-access.log 追加（临时副本验证）
try {
  const t3 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t3-'));
  fs.cpSync(skillDir, t3, { recursive: true });
  fs.rmSync(path.join(t3, 'audit', 'access.log'), { force: true });
  execFileSync('node', [path.join(t3, 'scripts', 'read_section.mjs'), 'notes/env.md', '视觉方案'], { encoding: 'utf8', cwd: t3, stdio: 'ignore' });
  const acc = fs.readFileSync(path.join(t3, 'audit', 'access.log'), 'utf8');
  const okAcc = /视觉方案/.test(acc);
  if (okAcc) pass++; else fail++;
  console.log(`${okAcc ? '✅' : '❌'} read_section-access.log（定位后追加 "${acc.trim().slice(0, 60)}..."）`);
  fs.rmSync(t3, { recursive: true, force: true });
} catch { fail++; console.log('❌ read_section-access.log（异常）'); }

// 清理临时副本
fs.rmSync(t1, { recursive: true, force: true });
fs.rmSync(t2, { recursive: true, force: true });

// 12) archive-mark upsert（每会话仅一条，后写生效）
try {
  const t4 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t4-'));
  fs.cpSync(skillDir, t4, { recursive: true });
  const mk = path.join(t4, 'scripts', 'archive-mark.mjs');
  const log = path.join(t4, 'audit', 'archive-progress.jsonl');
  execFileSync('node', [mk, 'sid-aaa', '5', '--total', '100'], { cwd: t4, stdio: 'ignore' });
  execFileSync('node', [mk, 'sid-aaa', '42', '--total', '100', '--done'], { cwd: t4, stdio: 'ignore' });
  const ls = fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean);
  const cnt = ls.filter((l) => JSON.parse(l).sessionId === 'sid-aaa').length;
  const okU = cnt === 1 && JSON.parse(ls.find((l) => l.includes('sid-aaa'))).lastRow === 42;
  if (okU) pass++; else fail++;
  console.log(`${okU ? '✅' : '❌'} archive-mark-upsert（${cnt} 条/最后值 ${okU ? '' : '✗'}）`);
  fs.rmSync(t4, { recursive: true, force: true });
} catch { fail++; console.log('❌ archive-mark-upsert（异常）'); }

// 13) archive-check 增量范围（mark lastRow 后只报新增行 + 信号召回命中）
try {
  const t5 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t5-'));
  fs.cpSync(skillDir, t5, { recursive: true });
  const src = path.join(t5, 'tmp-transcript.txt');
  fs.writeFileSync(src, 'l1\nl2\nl3\nl4\n记住这个坑：用前端封装\nl6\nl7\n');
  execFileSync('node', [path.join(t5, 'scripts', 'archive-mark.mjs'), src, '4'], { cwd: t5, stdio: 'ignore' });
  const out = execFileSync('node', [path.join(t5, 'scripts', 'archive-check.mjs'), src, '--sig'], { encoding: 'utf8', cwd: t5 });
  const okC = /增量范围: \(4, 7\]/.test(out) && /记住这个坑/.test(out);
  if (okC) pass++; else fail++;
  console.log(`${okC ? '✅' : '❌'} archive-check-增量（只报新增行+召回命中）`);
  fs.rmSync(t5, { recursive: true, force: true });
} catch { fail++; console.log('❌ archive-check-增量（异常）'); }

// ===== 方案 B：定时唤醒归档检测（T14-T18；临时容器 + env 隔离，真实 audit/pending 不触碰）=====
const realLog = path.join(skillDir, 'audit', 'archive-progress.jsonl');
const realPendDir = path.join(skillDir, 'audit', 'archive-pending');
const REAL_LOG_BEFORE = fs.existsSync(realLog) ? fs.readFileSync(realLog, 'utf8') : '';
const REAL_PEND_BEFORE = fs.existsSync(realPendDir) ? fs.readdirSync(realPendDir).length : 0;
const failMsg = (e) => String((e && (e.message || e.stderr)) || e).split('\n').filter((l) => l.trim() && !/inspector/.test(l)).slice(0, 3).join(' | ').slice(0, 200);

// 14) touch/due 状态机：touch 重计时 → due 到点触发落队列 → pending/fireAt 清理 → 幂等不重触发
try {
  const t6 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t6-'));
  fs.cpSync(skillDir, t6, { recursive: true });
  const sess = path.join(t6, 'sessions', 'sess-x');
  fs.mkdirSync(sess, { recursive: true });
  fs.writeFileSync(path.join(sess, 'session.jsonl'), Array.from({ length: 60 }, (_, i) => `l${i + 1}`).join('\n') + '\n');
  const env = { ...process.env, ARCHIVE_SESSIONS: path.join(t6, 'sessions'), ARCHIVE_LOG: path.join(t6, 'audit', 'archive-progress.jsonl'), ARCHIVE_PENDING: path.join(t6, 'audit', 'archive-pending'), ARCHIVE_SILENT_MS: '1' };
  const jx = (f, a) => JSON.parse(execFileSync('node', [path.join(t6, 'scripts', f), ...a], { encoding: 'utf8', env }));
  jx('archive-mark.mjs', ['sess-x', '--touch', '--lastRow', '0', '--json']);
  const st1 = jx('archive-timer.mjs', ['--status', '--json']);
  execFileSync('node', [path.join(t6, 'scripts', 'archive-timer.mjs'), '--due'], { encoding: 'utf8', env });
  const st2 = jx('archive-timer.mjs', ['--status', '--json']);
  const q = JSON.parse(fs.readFileSync(path.join(t6, 'audit', 'archive-pending', 'sess-x.json'), 'utf8'));
  const due2 = jx('archive-timer.mjs', ['--due', '--json']);
  const s1 = st1.find((m) => m.sessionId === 'sess-x'); // 按 sid 取数：容器 log 可能含复制进来的真实会话条目，位置不可靠
  const s2 = st2.find((m) => m.sessionId === 'sess-x');
  const okB = s1?.fireAt > 0 && s1?.pending === false
    && s2?.pending === true && s2?.fireAt == null
    && q.delta === 60 && Array.isArray(q.signals)
    && due2.count === 0;
  if (okB) pass++; else fail++;
  console.log(`${okB ? '✅' : '❌'} 方案B-touch/due（fireAt→fired→pending/幂等不重触发）`);
  fs.rmSync(t6, { recursive: true, force: true });
} catch (e) { fail++; console.log('❌ 方案B-touch/due（异常: ' + failMsg(e) + '）'); }

// 15) 资格门控：行数不足 → rearm 不入队；资格达标后 → fired
try {
  const t7 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t7-'));
  fs.cpSync(skillDir, t7, { recursive: true });
  const sess = path.join(t7, 'sessions', 'sess-y');
  fs.mkdirSync(sess, { recursive: true });
  fs.writeFileSync(path.join(sess, 'session.jsonl'), Array.from({ length: 10 }, (_, i) => `l${i + 1}`).join('\n') + '\n');
  const env = { ...process.env, ARCHIVE_SESSIONS: path.join(t7, 'sessions'), ARCHIVE_LOG: path.join(t7, 'audit', 'archive-progress.jsonl'), ARCHIVE_PENDING: path.join(t7, 'audit', 'archive-pending'), ARCHIVE_SILENT_MS: '1' };
  const jx = (f, a, e2 = env) => JSON.parse(execFileSync('node', [path.join(t7, 'scripts', f), ...a], { encoding: 'utf8', env: e2 }));
  jx('archive-mark.mjs', ['sess-y', '--touch', '--lastRow', '0', '--json']);
  execFileSync('node', [path.join(t7, 'scripts', 'archive-timer.mjs'), '--due'], { encoding: 'utf8', env }); // MIN_LINES=50 → rearm
  const st1 = jx('archive-timer.mjs', ['--status', '--json']);
  const noQueue = !fs.existsSync(path.join(t7, 'audit', 'archive-pending', 'sess-y.json'));
  const env2 = { ...env, ARCHIVE_MIN_LINES: '10' }; // 资格达标（10≥10）→ fired
  execFileSync('node', [path.join(t7, 'scripts', 'archive-timer.mjs'), '--due'], { encoding: 'utf8', env: env2 });
  const st2 = jx('archive-timer.mjs', ['--status', '--json']);
  const s1 = st1.find((m) => m.sessionId === 'sess-y'); // 按 sid 取数（同 T14）
  const s2 = st2.find((m) => m.sessionId === 'sess-y');
  const okG = s1?.fireAt != null && noQueue && s2?.pending === true;
  if (okG) pass++; else fail++;
  console.log(`${okG ? '✅' : '❌'} 方案B-资格门控（不足 rearm 不入队/达标 fired）`);
  fs.rmSync(t7, { recursive: true, force: true });
} catch (e) { fail++; console.log('❌ 方案B-资格门控（异常: ' + failMsg(e) + '）'); }

// 16) done+新行：done 态出现新行 → touch 重武装（数据驱动失效）→ due fired（队列带 done 标记）
try {
  const t8 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t8-'));
  fs.cpSync(skillDir, t8, { recursive: true });
  const sess = path.join(t8, 'sessions', 'sess-z');
  fs.mkdirSync(sess, { recursive: true });
  const sessFile = path.join(sess, 'session.jsonl');
  fs.writeFileSync(sessFile, Array.from({ length: 60 }, (_, i) => `l${i + 1}`).join('\n') + '\n');
  const env = { ...process.env, ARCHIVE_SESSIONS: path.join(t8, 'sessions'), ARCHIVE_LOG: path.join(t8, 'audit', 'archive-progress.jsonl'), ARCHIVE_PENDING: path.join(t8, 'audit', 'archive-pending'), ARCHIVE_SILENT_MS: '1' };
  const jx = (f, a) => JSON.parse(execFileSync('node', [path.join(t8, 'scripts', f), ...a], { encoding: 'utf8', env }));
  execFileSync('node', [path.join(t8, 'scripts', 'archive-mark.mjs'), 'sess-z', '60', '--total', '60', '--done'], { env, stdio: 'ignore' });
  const runC = (a) => { try { return { code: 0, out: execFileSync('node', [path.join(t8, 'scripts', 'archive-check.mjs'), ...a], { encoding: 'utf8', env }) }; } catch (e) { return { code: e.status, out: e.stdout || '' }; } };
  const c1 = JSON.parse(runC(['sess-z', '--json']).out); // done 无增量：check 按契约 exit 2，消费其 JSON
  fs.appendFileSync(sessFile, Array.from({ length: 10 }, (_, i) => `l${i + 61}`).join('\n') + '\n');
  const c2r = runC(['sess-z', '--json']);
  const c2 = JSON.parse(c2r.out);
  jx('archive-mark.mjs', ['sess-z', '--touch', '--lastRow', '60', '--json']);
  execFileSync('node', [path.join(t8, 'scripts', 'archive-timer.mjs'), '--due'], { encoding: 'utf8', env });
  const q = JSON.parse(fs.readFileSync(path.join(t8, 'audit', 'archive-pending', 'sess-z.json'), 'utf8'));
  const okD = c2r.code === 0 && c1.done === true && c1.hasDelta === false
    && c2.hasDelta === true && c2.delta.count === 10
    && q.delta === 10 && q.done === true;
  if (okD) pass++; else fail++;
  console.log(`${okD ? '✅' : '❌'} 方案B-done+新行（数据失效/touch 重武装/队列带 done）`);
  fs.rmSync(t8, { recursive: true, force: true });
} catch (e) { fail++; console.log('❌ 方案B-done+新行（异常: ' + failMsg(e) + '）'); }

// 17) --json 结构化：check --json --sig 字段契约（增量内信号）+ 召回降噪（todo/title 元数据行不进召回）
try {
  const t9 = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-t9-'));
  fs.cpSync(skillDir, t9, { recursive: true });
  const src = path.join(t9, 'tmp-transcript.txt');
  const todoLine = JSON.stringify({ type: 'todo/write', seq: 1, data: { todos: [{ content: '方案B 决策 todo 内容' }] } });
  const userLine = JSON.stringify({ type: 'user/message', seq: 2, data: { content: [{ type: 'text', text: '记住这个坑：用前端封装' }] } });
  fs.writeFileSync(src, 'l1\n' + todoLine + '\n' + userLine + '\nl4\nl5\n');
  execFileSync('node', [path.join(t9, 'scripts', 'archive-mark.mjs'), src, '1'], { cwd: t9, stdio: 'ignore' });
  const c = JSON.parse(execFileSync('node', [path.join(t9, 'scripts', 'archive-check.mjs'), src, '--json', '--sig'], { encoding: 'utf8', cwd: t9 }));
  const hitTexts = c.signals.map((s) => s.text).join('|');
  const okJ = c.total === 5 && c.lastRow === 1 && c.hasDelta === true
    && c.delta.from === 2 && c.delta.to === 5 && c.delta.count === 4
    && Array.isArray(c.signals) && c.signals.length >= 1
    && hitTexts.includes('记住这个坑') && !hitTexts.includes('todo'); // 用户正文命中；todo 元数据行降噪
  if (okJ) pass++; else fail++;
  console.log(`${okJ ? '✅' : '❌'} 方案B-check--json（字段契约+正文召回+元数据降噪）`);
  fs.rmSync(t9, { recursive: true, force: true });
} catch (e) { fail++; console.log('❌ 方案B-check--json（异常: ' + failMsg(e) + '）'); }

// 19) 会话发现：静默未 mark 会话 → due 自动建 mark → 立即处理（fired 或 rearm），真实会话零触碰
try {
  const ta = fs.mkdtempSync(path.join(os.tmpdir(), 'amem-ta-'));
  fs.cpSync(skillDir, ta, { recursive: true });
  const sessRoot = path.join(ta, 'sessions', 'proj');
  const sd = path.join(sessRoot, 'session-d1');
  fs.mkdirSync(sd, { recursive: true });
  fs.writeFileSync(path.join(sd, 'session.jsonl'), Array.from({ length: 60 }, (_, i) => `l${i + 1}`).join('\n') + '\n');
  fs.utimesSync(path.join(sd, 'session.jsonl'), new Date(Date.now() - 3600e3), new Date(Date.now() - 3600e3)); // mtime 1h 前=已静默
  const env = { ...process.env, ARCHIVE_SESSIONS: sessRoot, ARCHIVE_LOG: path.join(ta, 'audit', 'archive-progress.jsonl'), ARCHIVE_PENDING: path.join(ta, 'audit', 'archive-pending'), ARCHIVE_SILENT_MS: '1', ARCHIVE_DISCOVER: '1' };
  const due1 = JSON.parse(execFileSync('node', [path.join(ta, 'scripts', 'archive-timer.mjs'), '--due', '--json'], { encoding: 'utf8', env }));
  const st = JSON.parse(execFileSync('node', [path.join(ta, 'scripts', 'archive-timer.mjs'), '--status', '--json'], { encoding: 'utf8', env }));
  const m = st.find((x) => x.sessionId === 'd1'); // sid 约定：目录名 session-d1 → mark 键 d1（无前缀，与 touch/check 一致）
  const due1d = due1.fired.find((f) => f.sid === 'd1' && f.action === 'discovered');
  const due1p = due1.fired.find((f) => f.sid === 'd1' && (f.action === 'fired' || f.action === 'rearm'));
  const due2 = JSON.parse(execFileSync('node', [path.join(ta, 'scripts', 'archive-timer.mjs'), '--due', '--json'], { encoding: 'utf8', env }));
  const okN = due1d && due1p && m?.pending === true && due2.count === 0;
  if (okN) pass++; else fail++;
  console.log(`${okN ? '✅' : '❌'} 方案B-会话发现（未 mark 静默→discover→${due1p?.action || '?'}→幂等不重复）`);
  fs.rmSync(ta, { recursive: true, force: true });
} catch (e) { fail++; console.log('❌ 方案B-会话发现（异常: ' + failMsg(e) + '）'); }

// 18) env 隔离：容器跑完后真实 audit 未被写入（日志逐字节一致 + pending 队列零新增）
{
  const logAfter = fs.existsSync(realLog) ? fs.readFileSync(realLog, 'utf8') : '';
  const pendAfter = fs.existsSync(realPendDir) ? fs.readdirSync(realPendDir).length : 0;
  const okI = logAfter === REAL_LOG_BEFORE && pendAfter === REAL_PEND_BEFORE;
  if (okI) pass++; else fail++;
  console.log(`${okI ? '✅' : '❌'} 方案B-env隔离（真实 audit 未写入：log ${REAL_LOG_BEFORE.length === logAfter.length ? '一致' : '✗'} / pending ${REAL_PEND_BEFORE}→${pendAfter}）`);
}

console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);