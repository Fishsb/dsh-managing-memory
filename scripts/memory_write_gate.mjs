// memory_write_gate.mjs — 记忆写入前置门（重建版，v3：主文档硬限 / 辅助文档不拦截）
// 原脚本随 2026-08-22 备份丢失未逐字还原；本版按 SKILL.md §6 接口重建。
// 用法: node scripts/memory_write_gate.mjs <目标文件> <临时文件>
//   目标文件: MEMORY.md | USER.md | AGENT.md | notes/<file>.md（可绝对路径或相对技能目录）
// 容量红线只对主文档（MEMORY/USER/AGENT=会话注入面）生效；notes 等辅助文档按需读取，不设硬限（超 NOTES_WARN 仅提示）
// exit 0=允许（附核对：容量数字/占比、指针清单） 1=主文档超容量（合并精简或下沉 notes/） 2=指针悬空/未注册（先建子文档或 INDEX 注册） 3=用法错误
import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..'); // 自定位，不依赖 cwd

const [target, tmp] = process.argv.slice(2);
if (!target || !tmp) {
  console.error('用法: node memory_write_gate.mjs <MEMORY.md|USER.md|notes/<file>.md> <临时文件>');
  process.exit(3);
}
if (!fs.existsSync(tmp)) {
  console.error('临时文件不存在:', tmp);
  process.exit(3);
}

const targetPath = target.replace(/[\\/]+$/, '');
const base = targetPath.split(/[\\/]/).pop();
const isNotes = /^notes[\\/]/.test(targetPath) || base.startsWith('notes');

// v9：主文档（注入面）硬限扩容；辅助文档不拦截（仅超 NOTES_WARN 提示）
const LIMITS = { 'MEMORY.md': 3000, 'USER.md': 2000, 'AGENT.md': 2000 };
const NOTES_WARN = 8000;

const tmpText = fs.readFileSync(tmp, 'utf8');
const chars = tmpText.replace(/\s+/g, '').length;

const issues = [];
// 指针核对：MEMORY.md 与 AGENT.md 的拟写入内容会引用 notes/ 子文档
if (base === 'MEMORY.md' || base === 'AGENT.md') {
  const notesDir = join(skillDir, 'notes');
  const indexText = fs.existsSync(join(notesDir, 'INDEX.md')) ? fs.readFileSync(join(notesDir, 'INDEX.md'), 'utf8') : '';
  for (const m of tmpText.matchAll(/notes\/([A-Za-z0-9_-]+)\.md/g)) {
    if (!fs.existsSync(join(notesDir, m[1] + '.md'))) issues.push('指针悬空: notes/' + m[1] + '.md 不存在');
    else if (!indexText.includes(m[1] + '.md')) issues.push('未注册 INDEX: notes/' + m[1] + '.md');
  }
}

if (isNotes) {
  // 辅助文档：不拦截容量；超警戒线仅提示
  const warn = chars > NOTES_WARN ? ` ⚠️ 超 ${NOTES_WARN} 警戒线（按需拆分，不拦截）` : '';
  console.log(`exit=0 允许写入（notes 辅助文档） | 容量: ${chars} 字符${warn}${issues.length ? ' | ' + issues.join(' | ') : ''}`);
  process.exit(0);
}

const limit = LIMITS[base] ?? 3000;
const pct = Math.round((chars / limit) * 100);
const detail = ['容量: ' + chars + '/' + limit + ' 字符 (' + pct + '%)', ...issues];
if (chars > limit) {
  console.error('exit=1 超容量 | ' + detail.join(' | '));
  process.exit(1);
}
if (issues.length) {
  console.error('exit=2 ' + detail.join(' | '));
  process.exit(2);
}
console.log('exit=0 允许写入 | ' + detail.join(' | '));
process.exit(0);