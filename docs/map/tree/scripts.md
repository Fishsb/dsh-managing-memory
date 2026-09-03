# 文件索引 · scripts

> 由 sync.mjs 自动同步（职责为人工维护）。粒度 files：全量文件登记。

- `scripts/archive-check.mjs` — (4.1 KB) 归档检测：增量 (lastRow,total] 分析 + 信号召回 + 资格门控（惰性检测点版，方案 B 待定）
- `scripts/archive-mark.mjs` — (2.0 KB) 归档进度标记：archive-progress.jsonl 按 sessionId upsert（{lastRow,total,done,at}）
- `scripts/candidate_grep.mjs` — (2.5 KB) 候选召回：转录信号词扫描 → pending 候选（ADD-only，纯只读）
- `scripts/memory_health_check.mjs` — (10.4 KB) 记忆健康审计：覆盖/重复/指针·格式/超限四类检查，报告归档 audit\
- `scripts/memory_write_gate.mjs` — (2.4 KB) 记忆写入门禁：容量+指针校验（exit 0/1/2=通过/超容/悬空）
- `scripts/read_section.mjs` — (2.3 KB) 小节定位读取：§ 内容锚检索，命中写 audit\access.log（提升判据）
- `scripts/session_grep.mjs` — (2.0 KB) 会话回忆：zstd 转录关键词检索（Episodic）
- `scripts/test.mjs` — (6.8 KB) 引擎回归测试：13 用例（门禁/召回/归档增量/标记 upsert 等）
- `scripts/vendor/fzstd.cjs` — (23.9 KB) vendored zstd 解码库（零依赖转录解压，勿手改）
