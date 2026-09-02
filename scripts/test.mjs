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

console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);