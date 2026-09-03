# 模块 · audit

> 一级模块：目录。数据区（非记忆）。

- **路径**：`audit`
- **类型**：目录
- **职责**：审计报告归档+归档进度数据区（非记忆）：health 报告归档 / archive-progress.jsonl（归档检测增量进度）/ access.log（notes 检索命中统计）
- **负责**：由 scripts 引擎写入（memory_health_check / archive-check / read_section）；消费方=审计四问流程与条目提升判据
- **改动影响**：数据区——清空/删除影响归档增量检测基线与检索命中统计；health 不扫描、不计容量

## 相关模块
- `scripts` — 读写方：引擎三工具落盘数据于此
- `SKILL.md` — 协议层：§9 审计流程消费报告，§10 归档进度存储约束（非记忆/不计容量）

> 文件级细节见 ../tree/audit.md。
