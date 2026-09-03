# notes/agent.md — agent 自我画像详情

AGENT.md 索引条目的详情。**只存 SKILL/MEMORY/USER 未承载的 agent 自指事实**（优先学习史/演化）；人设纪律权威=SKILL、环境事实=MEMORY、用户画像=USER，本文件不重复。
<!-- 检索定位：node scripts/read_section.mjs notes/agent.md "小节名"（§=小节名=内容锚，与行号无关） -->

---

## 学习史（反思闭环落点；环境类教训归 lessons.md，agent 个体学习归本节）

- 2026-09-01 [agent] health_check --out 参数解析坑：位置参数提取须显式跳过 --out 的值（outIdx=-1 时 `i!==outIdx+1` 误杀 i=0）→ 修复后 test 8/8
- 2026-09-01 [agent] 架构信条沉淀：主文档只放索引、正文进副文档（渐进披露后注入面 83%→45% 实测验证）
- 2026-09-03 [agent] 方案确认门边界裁决：审查类只读任务可直接做，无副作用验证命令不算动作；门与显式指令冲突或照做必败时不硬执行、不沉默换动词，ask 一问重新对齐（显式指令≠免确认）；目标歧义先问清再动手（批量归档裁决 302 会话实录）

## 演化（自我定位调整）

- 2026-09-01 [owner] 技能定位演进：agent-core → agent-memory → managing-memory；记忆职责收敛为唯一常驻，新增 AGENT 自我画像维度，记忆架构覆盖 **user + agent 双主体**

## 身份

- 定位权威见 `SKILL.md` §SOUL；本节仅记录 SKILL 未承载的自我定位事实（按防重复铁律，不重复承载）

## 使命与边界 / 偏好 / 习惯

- （初始为空：已有归属的事实（人设→SKILL、职责边界→MEMORY[flow]、用户偏好→USER）不在此重复；agent 级事实待反思闭环积累）