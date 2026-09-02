#!/usr/bin/env node
// archive-check.mjs — 会话归档增量检测（读 mark + 解压转录 → 输出增量范围与候选召回，纯只读）
// 用法: node scripts/archive-check.mjs <sessionId|转录文件路径> [--sig]
//   转录: 缺省会按 sessionId 在 ~/.dsh/sessions 查找目录（zstd 用内嵌 fzstd 解码）；传文件路径直达（.jsonl/.txt 直接读，.zstd 解码）
//   --sig: 额外输出信号词召回行（纯召回不写库）
// 输出: mark 状态 + 增量范围 (lastRow, total] + 可选召回片段；退出码 0=有增量 2=无增量/转录缺失 3=用法错
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, isAbsolute, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const logFile = join(skillDir, 'audit', 'archive-progress.jsonl');
const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
const wantSig = argv.includes('--sig');
if (!target) { console.error('用法: node scripts/archive-check.mjs <sessionId|转录文件路径> [--sig]'); process.exit(3); }

// ---- 定位转录文件 ----
let file = null;
if (existsIs(target)) { file = target; }
else {
  // 按 sessionId 在会话树查找（目录名=sessionId，兼容 session- 前缀）
  const root = join(homedir(), '.dsh', 'sessions');
  const want = target.startsWith('session-') ? target : target;
  const dirs = [];
  const walk = async (d) => {
    for (const e of (await readdir(d, { withFileTypes: true }).catch(() => []))) {
      if (e.isDirectory()) { const f = join(d, e.name); if (e.name === want || e.name === 'session-' + want) dirs.push(f); else await walk(f); }
    }
  };
  await walk(root);
  for (const d of dirs) { const cand = join(d, 'session.jsonl.zstd'); if (await exists(cand)) { file = cand; break; } }
}
if (!file) { console.error(`转录未找到: ${target}`); process.exit(2); }

async function exists(p) { try { await stat(p); return true; } catch { return false; } }
function existsIs(p) { return isAbsolute(p) || /[\\/]/.test(p); }

// ---- 解码 ----
let text = '';
try {
  if (extname(file).toLowerCase() === '.zstd') {
    const buf = await readFile(file);
    const fz = require('./vendor/fzstd.cjs');
    text = Buffer.from(fz.decompress(buf)).toString('utf8');
  } else {
    text = await readFile(file, 'utf8');
  }
} catch (e) { console.error('解码失败:', e.message); process.exit(2); }
const total = text.split('\n').filter(Boolean).length;

// ---- 读 mark ----
let mark = null;
try {
  const lines = (await readFile(logFile, 'utf8')).split('\n').filter(Boolean);
  for (const l of lines) { try { const o = JSON.parse(l); if (o.sessionId === target || (target.startsWith('session-') && o.sessionId === target.replace(/^session-/, ''))) mark = o; } catch {} }
} catch { mark = null; }
const lastRow = mark && Number.isFinite(mark.lastRow) ? mark.lastRow : 0;
const start = lastRow + 1;

console.log(`会话 ${target}`);
console.log(`转录 ${basename(dirname(file))} | 总行数 ${total} | 已归档行 ${lastRow}${mark ? (mark.done ? '（done 完成态）' : '') : ''}`);
if (total <= lastRow) { console.log('无新增行（无增量或 done）；done 将在行数增长后自动失效再触发'); process.exit(2); }
console.log(`增量范围: (${lastRow}, ${total}] — ${total - lastRow} 行待检测`);

// ---- 可选信号召回（增量行内）----
if (wantSig) {
  const lines = text.split('\n').filter(Boolean);
  const SIG = /(记住|注意|踩坑|纠正|以后|别再|失败|改用|原因|根因|方案|决策|配置|红线|原则)/;
  const hits = [];
  for (let i = start - 1; i < lines.length; i++) {
    const s = lines[i].replace(/\s+/g, ' ').slice(0, 130);
    if (SIG.test(s) && s.length > 6) hits.push(`${i + 1}: ${s}`);
  }
  console.log(`\n信号召回（增量内 ${hits.length} 条命中，纯召回不写库）：`);
  hits.slice(0, 8).forEach((h) => console.log('  ' + h));
}
process.exit(0);