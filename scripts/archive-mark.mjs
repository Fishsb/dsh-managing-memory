#!/usr/bin/env node
// archive-mark.mjs — 会话归档进度标记（upsert by sessionId；日志在 audit\ 非记忆系统）
// 用法: node scripts/archive-mark.mjs <sessionId> <lastRow> [--total N] [--done]
// 数据: audit/archive-progress.jsonl，每会话仅最后一条有效；键=sessionId（转录目录名）
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const logFile = join(skillDir, 'audit', 'archive-progress.jsonl');
const argv = process.argv.slice(2);
const sessionId = argv.find((a) => !a.startsWith('--'));
const lastRow = Number(argv[argv.indexOf('--total') > -1 ? argv[0] !== '--total' ? argv.indexOf('--total') - 1 : -1 : 1]);
// 简化解析：位置参数 [sessionId, lastRow]，选项 --total/--done
const posArgs = argv.filter((a) => !a.startsWith('--'));
const sid = posArgs[0];
const lr = Number(posArgs[1]);
if (!sid || !Number.isFinite(lr)) {
  console.error('用法: node scripts/archive-mark.mjs <sessionId> <lastRow> [--total N] [--done]');
  process.exit(3);
}
const totalIdx = argv.indexOf('--total');
const done = argv.includes('--done');

await mkdir(dirname(logFile), { recursive: true }).catch(() => {});
let lines = [];
try { lines = (await readFile(logFile, 'utf8')).split('\n').filter(Boolean); } catch { lines = []; }
// upsert：剔掉该 sessionId 旧条目，追加新条目（保持"每会话仅最后一条"）
const keep = lines.filter((l) => { try { return JSON.parse(l).sessionId !== sid; } catch { return true; } });
const entry = { sessionId: sid, lastRow: lr, ...(totalIdx > -1 ? { total: Number(argv[totalIdx + 1]) } : {}), done, at: new Date().toISOString() };
keep.push(JSON.stringify(entry));
await writeFile(logFile, keep.join('\n') + '\n', 'utf8');
console.log(`mark ${sid}: lastRow=${lr}${entry.total ? ' total=' + entry.total : ''}${done ? ' done' : ''} → ${logFile}`);