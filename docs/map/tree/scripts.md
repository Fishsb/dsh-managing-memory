# 文件索引 · scripts

> 由 sync.mjs 自动同步（职责为人工维护）。粒度 files：全量文件登记。

- `scripts/archive-check.mjs` — (2.4 KB) 归档检测：增量 (lastRow,total] 分析 + 信号召回；--json 结构化（复用 archive-lib）
- `scripts/archive-lib.mjs` — (8.1 KB) 归档公共层：转录定位/解码/mark 读写/信号召回/pending 队列；env 隔离（插件与测试容器）
- `scripts/archive-mark.mjs` — (3.0 KB) 归档进度标记：upsert {lastRow,total,done,pending,lastTurnAt,fireAt}；--touch 重计时/--pending
- `scripts/archive-timer.mjs` — (7.7 KB) 方案 B 唤醒执行器：--due 到点触发→资格门控→落 pending 队列；--watch/--status/--pending-list/--dequeue
- `scripts/candidate_grep.mjs` — (2.5 KB) 候选召回：转录信号词扫描 → pending 候选（ADD-only，纯只读）
- `scripts/memory_health_check.mjs` — (10.4 KB) 记忆健康审计：覆盖/重复/指针·格式/超限四类检查，报告归档 audit\
- `scripts/memory_write_gate.mjs` — (2.4 KB) 记忆写入门禁：容量+指针校验（exit 0/1/2=通过/超容/悬空）
- `scripts/read_section.mjs` — (2.3 KB) 小节定位读取：§ 内容锚检索，命中写 audit\access.log（提升判据）
- `scripts/session_grep.mjs` — (2.0 KB) 会话回忆：zstd 转录关键词检索（Episodic）
- `scripts/test.mjs` — (17.8 KB) 引擎回归测试：18 用例（门禁/召回/归档增量/方案B 状态机/env 隔离）
- `scripts/vendor/fzstd.cjs` — (23.9 KB) vendored zstd 解码库（零依赖转录解压，勿手改）
