# 模块 · scripts

> 一级模块：目录。职责/影响需人工/agent 补充。

- **路径**：`scripts`
- **类型**：目录
- **职责**：会话归档检测引擎（archive-lib 公共层 / archive-check 增量召回 / archive-mark upsert / archive-timer 定时触发）+ 记忆体系工具（health/gate/read_section/session_grep/candidate_grep）
- **负责**：本模块为单一事实源（引擎），任何 agent/CLI/hook 经其 CLI 使用；SKILL.md 引用其入口
- **改动影响**：改动引擎 → 测试 scripts/test.mjs、SKILL §9/§10 协议、health 校验、治理 check；新增文件须同步 docs/map（sync）

## 相关模块
<!-- 跨模块影响面：改本模块必须同步检查的模块。方向：本模块影响它 / 本模块依赖它 / 双向。由 sync --links 给候选，人工确认后填。 -->
- `SKILL.md` — 协议层：引用引擎 CLI（§9/§10 归档检测流程）
- `docs/map/root.md` — 治理层：引擎文件清单受地图漂移门禁

> 文件级细节见 ../tree/scripts.md。
