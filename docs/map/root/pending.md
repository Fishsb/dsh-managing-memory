# 模块 · pending

> 一级模块：目录。候选暂存区。

- **路径**：`pending`
- **类型**：目录
- **职责**：候选暂存区（ADD-only）：会话收尾/审计产出的「值得记」候选先落此处，经四问评估后固化入册或删除
- **负责**：候选通道唯一落点——杜绝直接写 MEMORY/USER/AGENT/notes；非权威、不计容量、health 不扫
- **改动影响**：清空不影响权威记忆；候选固化仍须走 write_gate；本项目内兼作引擎测试夹具（candidate_grep 回归）

## 相关模块
- `audit` — 流程衔接：审计四问评估消费候选（approval → 入册 / 拒绝 → 删除）
- `scripts` — 读写方：candidate_grep 只读召回
- `SKILL.md` — 协议层：§9 候选通道与收尾清单

> 文件级细节见 ../tree/pending.md。
