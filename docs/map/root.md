# 模块总览 · dsh-managing-memory

> 模块级职责/影响面。**相关模块 = 跨模块影响面**：改一个模块前必须检查其相关模块。
> 本表由 sync 从 root/<模块>.md 自动汇总（【模块表】标记之间请勿手改）；候选可由 `sync --links` 探测。

<!-- MODULE_TABLE_BEGIN -->
| 模块 | 职责 | 相关模块 |
|---|---|---|
| `audit` | 审计报告归档+归档进度数据区（非记忆）:health 报告归档 / archive-progress.jsonl（归档检测增量进度）/ access.log（notes 检索命中统计） | `scripts` |
| `notes` | 记忆详情七类+INDEX 注册表（索引指针目标）:env/tools/flows/lessons/release/user/agent 详情 + INDEX.md；小节名=内容锚（read_section 按锚定位） | `scripts` |
| `pending` | 候选暂存区（ADD-only）:会话收尾/审计产出的「值得记」候选先落此处，经四问评估后固化入册或删除 | `audit`、`scripts` |
| `scripts` | 归档检测+记忆工具引擎（单一事实源）:archive-check（增量+信号召回）/ archive-mark（进度 upsert）+ health/write_gate/read_section/session_grep/candidate_grep；vendor/fzstd 零依赖解码 | `notes`、`pending` |
<!-- MODULE_TABLE_END -->
