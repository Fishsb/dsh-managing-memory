# 架构决策记录（ADR）

> 记录「为什么这样设计」的重大决策，供未来 agent / 人复用，避免重复决策或踩旧坑。
> 新增一条：`node <skill>/scripts/adr.mjs . "<决策标题>"`（自动编号 ADR-XXXX.md）。

| ADR | 标题 | 状态 | 日期 |
|---|---|---|---|
| ADR-0002 | 方案 C：归档裁决自动闭环——引擎判定契约 + 插件 LLM 调度 + 候选人工终审 | proposed | 2026-09-03 |
| ADR-0001 | 方案 B：会话级定时唤醒归档检测（archive-lib/timer 引擎 + daemon-loop 插件） | accepted | 2026-09-03 |
