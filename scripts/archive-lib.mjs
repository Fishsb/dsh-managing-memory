#!/usr/bin/env node
// archive-lib.mjs — 会话归档检测公共层（单一事实源的公共部分）
// 定位/解码/行数/mark 读写/信号召回/pending 队列/env 隔离——archive-check / archive-mark / archive-timer 复用
// env 隔离（插件与测试容器用）：ARCHIVE_LOG / ARCHIVE_PENDING / ARCHIVE_SESSIONS / ARCHIVE_SILENT_MS
import { readFile, writeFile, readdir, stat, mkdir, rm } from 'node:fs/promises';
import { join, dirname, isAbsolute, extname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export const scriptDir = dirname(fileURLToPath(import.meta.url));
export const skillDir = join(scriptDir, '..');

// ---- 路径与参数（env 可覆盖，缺省=技能目录内）----
const envOf = (k, d) => (process.env[k] != null && process.env[k] !== '' ? process.env[k] : d);
export function pathConfig() {
  return {
    log: envOf('ARCHIVE_LOG', join(skillDir, 'audit', 'archive-progress.jsonl')),
    pendingDir: envOf('ARCHIVE_PENDING', join(skillDir, 'audit', 'archive-pending')),
    sessionsRoot: envOf('ARCHIVE_SESSIONS', join(homedir(), '.dsh', 'sessions')),
    silentMs: Number(envOf('ARCHIVE_SILENT_MS', DEFAULT_SILENT_MS)) || DEFAULT_SILENT_MS,
  };
}
export const DEFAULT_SILENT_MS = 780000; // 静默阈值 780s（自最后 touch 起算）

// ---- 信号召回正则（纯召回不写库）----
export const SIG_RE = /(记住|注意|踩坑|纠正|以后|别再|失败|改用|原因|根因|方案|决策|配置|红线|原则)/;

const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

// ---- 转录定位：直接文件路径 或 按 sessionId 走会话树（zstd 优先，明文 .jsonl 兜底）----
export async function locateTranscript(target) {
  if (isAbsolute(target) || /[\\/]/.test(target)) return (await exists(target)) ? target : null;
  const root = pathConfig().sessionsRoot;
  const dirs = [];
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) {
      if (!e.isDirectory()) continue;
      const f = join(d, e.name);
      if (e.name === target || e.name === 'session-' + target) dirs.push(f); else await walk(f);
    }
  };
  await walk(root);
  for (const d of dirs) {
    for (const name of ['session.jsonl.zstd', 'session.jsonl']) {
      const cand = join(d, name);
      if (await exists(cand)) return cand;
    }
  }
  return null;
}

// ---- 解码（.zstd → 内嵌 fzstd；其余按 utf8）----
export async function decodeTranscript(file) {
  if (extname(file).toLowerCase() === '.zstd') {
    const buf = await readFile(file);
    const fz = require(join(scriptDir, 'vendor', 'fzstd.cjs'));
    return Buffer.from(fz.decompress(buf)).toString('utf8');
  }
  return readFile(file, 'utf8');
}

export const countLines = (text) => text.split('\n').filter(Boolean).length;

// ---- mark 读写（upsert by sessionId，每会话仅最后一条有效；兼容 session- 前缀）----
export const normalizeSid = (sid) => String(sid).replace(/^session-/, '');
export async function readMarks(logFile = pathConfig().log) {
  try {
    return (await readFile(logFile, 'utf8')).split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}
export async function findMark(sid, logFile = pathConfig().log) {
  const n = normalizeSid(sid);
  return (await readMarks(logFile)).find((m) => normalizeSid(m.sessionId || '') === n) || null;
}
export async function upsertMark(entry, logFile = pathConfig().log) {
  const n = normalizeSid(entry.sessionId);
  await mkdir(dirname(logFile), { recursive: true }).catch(() => {});
  const ms = await readMarks(logFile);
  const keep = ms.filter((m) => normalizeSid(m.sessionId || '') !== n);
  keep.push({ ...entry, at: entry.at ?? new Date().toISOString() });
  await writeFile(logFile, keep.map((m) => JSON.stringify(m)).join('\n') + '\n', 'utf8');
  return keep.find((m) => normalizeSid(m.sessionId || '') === n);
}

// ---- 信号召回（增量行内，纯召回）----
export function recallSignals(lines, from /* 1-based 首条新行 */, limit = 8) {
  const hits = [];
  for (let i = from - 1; i < lines.length; i++) {
    const s = String(lines[i]).replace(/\s+/g, ' ').slice(0, 130);
    if (SIG_RE.test(s) && s.length > 6) hits.push({ row: i + 1, text: s });
  }
  return hits.slice(0, limit);
}

// ---- pending 队列（audit/archive-pending/<安全名>.json；唤醒裁决入口）----
const safeName = (sid) => normalizeSid(sid).replace(/[\\/:*?"<>|]+/g, '_');
export const pendingFileFor = (sid, dir = pathConfig().pendingDir) => join(dir, safeName(sid) + '.json');
export async function writePending(sid, payload, dir = pathConfig().pendingDir) {
  await mkdir(dir, { recursive: true }).catch(() => {});
  const file = pendingFileFor(sid, dir);
  await writeFile(file, JSON.stringify({ sessionId: sid, ...payload }, null, 2), 'utf8');
  return file;
}
export async function listPending(dir = pathConfig().pendingDir) {
  try { return (await readdir(dir)).filter((f) => f.endsWith('.json')).sort(); } catch { return []; }
}
export async function readPending(sid, dir = pathConfig().pendingDir) {
  try { return JSON.parse(await readFile(pendingFileFor(sid, dir), 'utf8')); } catch { return null; }
}
export async function removePending(sid, dir = pathConfig().pendingDir) { await rm(pendingFileFor(sid, dir), { force: true }); }
