# 模块 · scripts

> 一级模块：目录。引擎层。

- **路径**：`scripts`
- **类型**：目录
- **职责**：归档检测+记忆工具引擎（单一事实源）：archive-lib 公共层（env 隔离）/ archive-check（增量+召回+--json）/ archive-mark（进度+touch）/ archive-timer（方案 B 定时唤醒+pending 队列）+ health/write_gate/read_section/session_grep/candidate_grep；vendor/fzstd 零依赖解码
- **负责**：任何 agent/CLI/hook 经其 CLI 使用；SKILL §6/§9/§10 引用其入口；数据落盘 audit\（进度/命中日志）与 pending\（候选）
- **改动影响**：改动引擎必跑 scripts/test.mjs 回归（13 用例）并核对 SKILL 协议一致；新增文件须 sync 登记；CLI 参数/exit 码变化为破坏性（write_gate 0/1/2 契约）

## 相关模块
<!-- 跨模块影响面：改本模块必须同步检查的模块。方向：本模块影响它 / 本模块依赖它 / 双向。由 sync --links 给候选，人工确认后填。 -->
- `notes` — 数据读写：write_gate/read_section/session_grep 消费详情小节
- `pending` — 数据读写：health 候选统计消费 pending\；test 断言候选召回纯只读
- `SKILL.md` — 协议层：§6 写入门、§9 审计、§10 归档检测引用 CLI
- `docs/map/` — 治理层：文件清单受地图漂移门禁（新增须 sync）

> 文件级细节见 ../tree/scripts.md。
