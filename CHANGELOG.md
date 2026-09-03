# Changelog

> dsh-managing-memory 更新日志。基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Fixed
- 治理完整性修复：index.md CHANGELOG 死链（`../`→`../../`，pre-commit 门禁自锁解除）、补齐 root/audit-notes-pending 三模块文档与 index 导航概况/root 派生表语义字段、tree 职责注记补全。
- 治理补全：facts.md 模板部署 + AGENTS/CLAUDE 规则 0（用户事实铁律）、relatedness 规则开启（warn）、scripts→pending 关联补记。

### Added
- 方案 B 引擎（ADR-0001）：`archive-lib.mjs` 公共层（定位/解码/mark/召回/队列，env 隔离）、`archive-timer.mjs`（--due/--watch/--status/--pending-list/--dequeue，到点唤醒→资格门控→落 audit/archive-pending 队列→唤醒后清理）。
- `archive-check.mjs` 复用公共层 + `--json` 结构化；`archive-mark.mjs` 行结构扩展（pending/lastTurnAt/fireAt）+ `--touch`（重计时/清队列）/`--pending`/`--json`；参数解析值感知（--total/--lastRow 的值不再误收为位置参）。
- SKILL §10 协议升级为方案 B（turn 后 touch / 宿主唤醒 / 队列裁决 / dequeue 清队）、§9 收尾清单 +touch 步骤；测试 13→18 用例全绿（touch/due 状态机/资格门控/done+新行/--json 契约/env 隔离）。
- 项目建立：会话归档检测插件化改造开发（方案 B），从 managing-memory 技能迁移引擎 + 治理初始化。
- 引擎基线（scripts/）：archive-check（增量+召回）、archive-mark（upsert），含 vendor/fzstd 零依赖解码。
- 治理：docs/map（files 粒度）+ AGENTS.md + pre-commit hook（project-map-governance v3）。
- 开发夹具：notes/ 骨架（小节名与索引对齐）、pending/README、audit/.gitkeep——引擎 13/13 可在项目内回归。
