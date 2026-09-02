# 模块总览 · dsh-managing-memory

> 模块级职责/影响面。**相关模块 = 跨模块影响面**：改一个模块前必须检查其相关模块。
> 本表由 sync 从 root/<模块>.md 自动汇总（【模块表】标记之间请勿手改）；候选可由 `sync --links` 探测。

<!-- MODULE_TABLE_BEGIN -->
| 模块 | 职责 | 相关模块 | 负责 |
|---|---|---|---|
| `audit` | （待填） | （待填） | （待填） |
| `notes` | （待填） | （待填） | （待填） |
| `pending` | （待填） | （待填） | （待填） |
| `scripts` | 会话归档检测引擎（archive-lib 公共层 / archive-check 增量召回 / archive-mark upsert / archive-timer 定时触发）+ 记忆体系工具（health/gate/read_section/session_grep/candidate_grep） | （待填） | 本模块为单一事实源（引擎），任何 agent/CLI/hook 经其 CLI 使用；SKILL.md 引用其入口 |
<!-- MODULE_TABLE_END -->
