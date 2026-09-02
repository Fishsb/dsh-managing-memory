#!/usr/bin/env node
// candidate_grep.mjs — 价值候选召回（只读，绝不写记忆库）
// 用法: node scripts/candidate_grep.mjs [关键词] [--max N] [--dir <明文目录>]
// 扫描明文会话记录（缺省 ~/.dsh/memory/conversations/*.jsonl），按信号词召回"值得记忆"候选行：
//   强信号：记住/以后/注意/踩坑/纠正/别再用/应该改成/别忘了…
//   中信号：失败→换路 / 改用/换成 / 原因描述…
// 输出 时间|文件:行|置信|片段。纯召回不写库；判定入册由四问（§6）+ 审计（§9）负责。
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import os from 'node:os';

const argv = process.argv.slice(2);
const kw = argv.find((a) => !a.startsWith('--'));
const max = Number(argv[argv.indexOf('--max') + 1] ?? 20);
const dir = argv.indexOf('--dir') > -1 ? argv[argv.indexOf('--dir') + 1] : join(os.homedir(), '.dsh', 'memory', 'conversations');

const STRONG = ['记住', '以后', '注意', '踩坑', '原来是这样', '应该改成', '别再用', '纠正', '别忘了', '务必'];
const MID = [/失败.{0,24}(换|改)用/, /(报错|失败).{0,16}(换|改)用/, /改用.{0,12}(工具|方式|方案|命令)/, /原因.{0,12}(是|为|在于)/, /(记|存).{0,6}(到|进)/];

let files = [];
try { files = (await readdir(dir)).filter((f) => f.endsWith('.jsonl')).sort(); } catch { files = []; }
if (!files.length) {
  console.error(`无明文会话文件: ${dir}（完整转录为 zstd 需解压后检索）`);
  process.exit(1);
}

const rxKw = kw ? new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
let hits = 0;
for (const f of files) {
  if (hits >= max) break;
  const raw = await readFile(join(dir, f), 'utf8').catch(() => '');
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length && hits < max; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (rxKw && !rxKw.test(line)) continue;
    const strong = STRONG.some((s) => line.includes(s));
    const mid = MID.some((re) => re.test(line));
    if (!strong && !mid) continue;
    hits++;
    const t = (line.match(/"recordedAt":"([^"]+)"/) || [, f])[1].slice(0, 19) || f;
    console.log(`${t} | ${f}:${i + 1} | ${strong ? '【强】' : '【中】'} ${line.slice(0, 140)}`);
  }
}
console.log(`\n共召回 ${hits} 条候选（强：记住/踩坑/纠正/以后…；中：失败换路/原因…）。纯召回不写库，判定入册走四问+审计。`);
process.exit(hits ? 0 : 1);