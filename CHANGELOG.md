# Changelog

> dsh-managing-memory 更新日志。基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Fixed
- **spawnSync 冻死主线程根治（2026-09-05，WorkBuddy 诊断 + 补丁同步 src）**：daemon tick 的 `spawnSync(archive-timer --due)` 同步阻塞主线程——会话树积累 348MB 后扫描 120s 跑不完 → 每 tick 冻结 web 服务 120s → 超时杀掉空 result → 循环冻死（日志铁证 `tick error: stdout 非 JSON |` 空输出；归档此前一直空转失败从未成功）。修：daemon-loop 改**异步 spawn**（主线程零等待）+ **在航守卫**（ticking 上一轮没跑完跳过本 tick）+ 超时放宽 10 分钟。验证：tick 窗口内请求冻结 25s+ → 2ms；archive-timer 首次真正跑完（完整 due/rearm 记录）。补丁已同步 src/index.ts（消除重新 build 覆盖隐患），备份 lib/index.js.bak-pre-asyncfix-20260905。
- **蒸馏子代理递归根治（2026-09-05，参考 dsh-mnemon 架构）**：spawn 的蒸馏子代理完成后自身转录落 sessions 树 → 被 --due 当静默会话再次蒸馏 → 无限递归（每 60s 一次 API 调用彻夜不停）。修（mnemon「child 永不 idle-review」架构）：① 引擎 `archive-lib.isSubagentSession()`（读转录 header origin=subagent/parentSession，兼容 zstd）② discover 步排除 subagent ③ `--pending-list` 过滤 subagent 队列项 ④ runDue 对「会动作」mark 拦截并清 mark 出网（subagent-clear，实测清 84 个）⑤ distillOne 仅 completed 才 done+dequeue（aborted 保留重试）。验证：递归 spawn 停止、pending 队列 0、84 个 subagent mark 清出网。
- **F-001 idleWakeMs 未生效修复（2026-09-05）**：插件 config idleWakeMs（默认 600s=10min）此前未传引擎，实际静默判定用引擎缺省 780s=13min。修：daemon tick 异步 spawn 带 `env ARCHIVE_SILENT_MS=idleWakeMs` → 10 分钟唤醒判定真正生效。

### Fixed
- **用户确定事实登记（2026-09-05）**：F-001 蒸馏子代理唤醒判定=会话任务停止时长（可配置、非任务结束即唤醒）；F-002 蒸馏子代理模型可配置；UI 开发待办（唤醒空闲时长 + 蒸馏模型两配置项 UI）。登记于 docs/map/facts.md。
- **深思考流式会话召回缺口（实测实证 2026-09-05）**：`archive-lib.mjs` 召回只命中 user/assistant 完整行，深思考会话正文被切成 `text-chunks` delta 增量行（dt/texts）与 `assistant/chunk`（block-end），结论（根因/对策等）对裁决 LLM 不可见 → 真知识被误 SKIP。修：`extractUtterance` 展开 `assistant/chunk` block.text 与 `assistant/message` content；新增 `decodeTextChunksDelta` 跨行累积还原流式正文，`recallSignals` 命中含 SIG 的 delta 结论窗口。实测：386 行复盘会话 signals 1→8（知识结论行全命中）；dev+prod 双份同步。
- **方案 C 自动闭环卡死根治（插件 lib/src v2，2026-09-04 审查实证）**：① 裁决触发死锁——tick 仅当 pending≥5 才裁决，3 条队列永不处理 → 改队列非空+冷却即裁决（冷却/batch 内控）；② 固化触发死锁——候选≥6 才固化，4 候选永不处理 → 改候选存在+1h 冷却即固化（宁缺毋滥归固化 LLM+memory-append 安全阀，mergeThreshold 降为提示）；③ LLM 路由传染——捕获宿主 llm/stream 路由永久钉死，故障模型 3 连空响应停摆 → 路由候选链 config>env>宿主捕获，捕获路由连续失败 ≥2 自动弃用、随宿主 llm/stream 刷新重捕获重试；④ 日期硬编码 `2026-09-04-arb-` → 运行时 `new Date()` + 通用前缀正则 `^\d{4}-\d{2}-\d{2}-arb-`（跨天不死，历史候选可收集）；⑤ src/index.ts 与 lib 同步（此前 lib 08:33 > src 02:10 且注释 v1「人工终审」残留）；⑥ SKILL §10 裁决节方案 B「fork 子代理」→ 方案 C 全自动语义（生产副本+本仓源同步）。

### Added
- **方案 E：蒸馏触发事件驱动化（ADR-0004，2026-09-05 根治性重构）**：第一性原理审查判定补丁循环根源=「用文件轮询+CLI 子进程+多套状态机重新发明 DSH 原生会话生命周期观测」。重构为 `session/event` watcher（turn/end completed + root agent origin 判据单行替代 5 层过滤）→ per-agent idle 定时器（F-001 默认 10min，agent/disposed 自动清理）→ 内存增量 snapshotEvents 水位（零扫描零解压）→ spawn 蒸馏子代理（10min 超时 race，事件架构下递归天然消失）→ memory-append 安全阀入册 → 水位 `audit/distill-watermark.jsonl`。插件内**全部 spawnSync 退役**（runAsync 全异步，5 工具+蒸馏链路，冻死问题机制性根除）；蒸馏侧 pending 队列/state 字段/distill-queue 退役；规范修正 scoped `@deepseek-ai/cordis` peer + zstd 多帧契约标注 + UI 走 settings 官方契约（待办）。**退役**：轮询 tick/discover/蒸馏侧 mark 状态机/touch 协议依赖/ticking 守卫；archive-timer CLI 保留手动兜底。Spike 实证 session/event 对注入插件可达 + roots adopt。
- **方案 D：spawn 蒸馏子代理单通道（ADR-0003，2026-09-05 落地+E2E）**：蒸馏固化收敛单一自动通道——daemon `--due` 发现静默会话（唤醒判定=任务停止满 idleWakeMs，F-001 默认 10min）→ `ctx.subagents.start('spawn')` 蒸馏子代理（feed 转录信号+pending 候选，借活 agent 宿主，跳过 origin=subagent 防递归）→ 子代理四问裁决+查重 → 输出结构化 JSON → 宿主 memory-append 安全阀入册 → completed 才 done+dequeue。模型 agentOptions 空=继承主会话 / config 可指定（F-002，需真实 adapter 名）。替代方案 C daemon 内 LLM 直裁（ADR-0002 v2 被 ADR-0003 取代）；E2E 实测：新知识正确入册 notes+MEMORY 索引（含写前备份）、重复知识 SKIP 查重、aborted 保留重试不丢内容。UI 配置待办：唤醒时长 + 蒸馏模型两配置项（facts.md 登记）。
- 方案 C 全自动闭环（ADR-0002 v2，用户拍板无人工终审）：插件 daemon 自动 LLM 四问裁决（pending≥5/冷却 30min）→ SKIP 自动 mark done+dequeue、ADD 落候选 → 候选≥6 自动固化：LLM 结构化落点指令 + 新引擎 `memory-append`（安全阀=白名单/无锚拒写/主文档容量门禁/写前备份）→ **全自动入册，无人工环**；测试 22→23 全绿。
- 容量分层重构：容量红线只对主文档（MEMORY 3000 / USER·AGENT 2000）；notes 等辅助文档解除硬限（>8000 仅提示）；health/gate/SKILL/spec v10 同步；容器净化修复 prod 测试 flakiness（cleanContainer + 溯源断言）。
- 碎片治理（复盘结论 2 落地）：`--due` 内建**机械消化**——无信号且 <`ARCHIVE_MECH_NOOP_LINES`（缺省 500，0=关）的会话直接 done 不进裁决队列（消灭 82% 无谓裁决）；`--drain` **排空模式**——大 batch 循环捞历史静默未 mark 会话至无剩，一次性消化积压（终结「边清边长」）；测试 20→22 用例全绿（新增机械消化/排空正向用例；消除活跃保护 1ms 测试竞态——容器测试显式回拨 mtime）。
- 归档队列批量裁决落地（workflow 4 波 33 agents）：302+ 会话四问裁决（ADD 54 会话/SKIP 248，宁缺毋滥），产 58 候选文件；已裁决队列文件 rename 隔离至 audit/archive-pending-done（safe-delete shim 批量删除拦截规避，可逆；2026-09-04 移出技能目录至 ~/.dsh/archive-pending-done-20260903 防容器拷贝膨胀）。
- 候选预合并+四问固化入册（重组 5 notes 文件，全部门禁 exit 0：tools 93%/flows 80%/lessons 98%/env 81%/release 61%）：新增 13 条索引路由（动态 Cordis 坑/插件开发坑/preset 机制/无头浏览器/pmg 缺陷/DSH 组装链/实例更新 alpha SOP/记忆体系分工等），既有小节全量压缩增补（保留全部内容锚）；INDEX 元数据表 +13 行；MEMORY 索引 37 条路由 96%（超 85% 警戒线，下次审计触发点）；候选归档 pending/.processed 58 文件；镜像生产→dev 9/9 哈希一致。
- 活跃保护+数据驱动重武装（机器层兜底）：fireAt 到点但转录 mtime 仍新鲜 → 引擎自动 rearm（忘 touch 的活跃会话不误触发，touch 降级为可选优化）；fireAt=null+已静默+转录 size 变化（mark 记录 lastSize）→ 自动重武装（重启重计时兜底）；测试 19→20 用例全绿（活跃 rearm→静默 fired→clear 后变化再武装）。
- 会话发现机制（补脱管缺口）：`archive-timer --due` 增加发现步——静默超阈值且无 mark 的会话自动建 mark 入网（agent 忘 touch/工具型会话零协议成本），`ARCHIVE_DISCOVER=0` 可关、`ARCHIVE_DISCOVER_BATCH` 限批最旧优先；同毫秒竞态修复（now 在发现步后采样）；测试 18→19 用例全绿。真实环境验证：历史会话批量入网、本会话被发现路径覆盖。
- 召回增强：JSONL 转录行提取对话正文匹配（extractUtterance），session/title·todo/write 等结构化状态行降噪不入召回；信号更准（todo 计划性内容不再误命中）。

### Fixed
- 治理体检（2026-09-04）：ADR-0002 v1（proposed/人工终审）与已落地的全自动闭环矛盾 → 追平为 v2（accepted/无人工环，含 v1→v2 拍板修订记录，阈值按实际 5 条/5min/merge≥6 修正）；decisions/README 索引同步；用例计数漂移修正（root/tree scripts 13/22→23，实测 23 PASS）。
- 测试健壮性：方案 B 状态机断言改按 sessionId 取数（此前按数组位置，容器 log 含真实会话条目时错位——生产副本 16/2 假阴性根因）；双侧 18/18 复绿。
- 治理完整性修复：index.md CHANGELOG 死链（`../`→`../../`，pre-commit 门禁自锁解除）、补齐 root/audit-notes-pending 三模块文档与 index 导航概况/root 派生表语义字段、tree 职责注记补全。
- 治理补全：facts.md 模板部署 + AGENTS/CLAUDE 规则 0（用户事实铁律）、relatedness 规则开启（warn）、scripts→pending 关联补记。

### Added
- hybrid 插件 `@dsh-external/dsh-managing-memory` 0.0.1：daemon-loop 每 tick 调 `archive-timer --due`（宿主常驻唤醒执行者）+ 5 原生工具（status/due/check/touch/pending，走引擎 `--json`）；无 DSH checkout 按 ADR-0001 预案手写 lib 产物，依赖 junction 复用宿主树；已 `dev_inject_plugin` 注入并完成 E2E（check 真实 zstd 转录 35746 行/touch/due/status/pending）。源码 `C:\Users\lk\.dsh\plugins\dsh-managing-memory`（独立于本仓版本线）。
- 生产技能部署副本同步：引擎 4 文件 + test.mjs + SKILL.md §9/§10 复制到 `~\.dsh\skills\managing-memory\`，生产侧回归 18/18 全绿。
- 方案 B 引擎（ADR-0001）：`archive-lib.mjs` 公共层（定位/解码/mark/召回/队列，env 隔离）、`archive-timer.mjs`（--due/--watch/--status/--pending-list/--dequeue，到点唤醒→资格门控→落 audit/archive-pending 队列→唤醒后清理）。
- `archive-check.mjs` 复用公共层 + `--json` 结构化；`archive-mark.mjs` 行结构扩展（pending/lastTurnAt/fireAt）+ `--touch`（重计时/清队列）/`--pending`/`--json`；参数解析值感知（--total/--lastRow 的值不再误收为位置参）。
- SKILL §10 协议升级为方案 B（turn 后 touch / 宿主唤醒 / 队列裁决 / dequeue 清队）、§9 收尾清单 +touch 步骤；测试 13→18 用例全绿（touch/due 状态机/资格门控/done+新行/--json 契约/env 隔离）。
- 项目建立：会话归档检测插件化改造开发（方案 B），从 managing-memory 技能迁移引擎 + 治理初始化。
- 引擎基线（scripts/）：archive-check（增量+召回）、archive-mark（upsert），含 vendor/fzstd 零依赖解码。
- 治理：docs/map（files 粒度）+ AGENTS.md + pre-commit hook（project-map-governance v3）。
- 开发夹具：notes/ 骨架（小节名与索引对齐）、pending/README、audit/.gitkeep——引擎 13/13 可在项目内回归。
