# 项目地图 · dsh-memory-archive

> dsh-memory-archive：DSH 会话归档检测引擎与插件化改造。单一事实源=scripts/*.mjs（archive-lib/check/mark/timer），SKILL §9/§10 协议与治理文档见根。。本文件是 LLM 友好导航（llms.txt 式）：先读这一句 + 导航，细节按链接按需取。

## 导航

- `audit` — 见 root/audit.md（职责待填）
- `notes` — 见 root/notes.md（职责待填）
- `pending` — 见 root/pending.md（职责待填）
- `scripts` — 见 root/scripts.md（职责待填）

## 治理

- [模块总览（含关联总图）](root.md)
- [文件级地图](tree/)（粒度：文件级（全量））
- [工程约定](conventions.md) — 按需创建（技术栈/命令/模式）
- [架构决策](decisions/README.md) — ADR 记录（新增：`node <skill>/scripts/adr.mjs . "<标题>"`）
- [更新日志](../CHANGELOG.md)

## Optional

- memo/ — 按需深挖的细节文档（关键符号/决策/坑）
- devref/ — 本地开发参考（gitignore 排除，不推 GitHub）
- 全量文件清单：不落盘；`node <skill>/scripts/sync.mjs . --list <模块>` 按需查看
