# 模块 · notes

> 一级模块：目录。记忆详情层。

- **路径**：`notes`
- **类型**：目录
- **职责**：记忆详情七类+INDEX 注册表（索引指针目标）：env/tools/flows/lessons/release/user/agent 详情 + INDEX.md；小节名=内容锚（read_section 按锚定位）
- **负责**：详情唯一承载——索引行在根三索引（MEMORY/USER/AGENT），正文在小节；写入必须过 memory_write_gate（超容量/悬空指针拦截）
- **改动影响**：小节改名/删除 → 悬空指针（gate exit 2）；新子文档须 INDEX.md 注册；概况与内容失真触发审计抽查

## 相关模块
- `scripts` — 读写方：write_gate/read_section/session_grep 消费
- `SKILL.md` — 协议层：§6 写入前置门、§9 四问审计与五处同步清单

> 文件级细节见 ../tree/notes.md。
