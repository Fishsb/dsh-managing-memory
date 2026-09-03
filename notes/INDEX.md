# notes/INDEX.md — 子文档注册表

MEMORY.md/USER.md 索引行的 `→ notes/<file>.md` 指针在此注册。**技能内文件间引用一律相对**，本目录可整体迁移。

| 子文档 | 内容 | 覆盖 |
|--------|------|------|
| `env.md` | 环境详情（DSH 环境 / WorkBuddy / 视觉 / prompt-enhancer / npm 执行策略） | `[env]` |
| `tools.md` | 工具配置详情（Zhihu / ZCode / MCP） | `[tool]` |
| `flows.md` | 流程详情（全局纪律 / 职责边界 / dsh 插件更新） | `[flow]` |
| `lessons.md` | 踩坑教训详情（网络 / 自托管 / Cordis 沙箱 / CRLF / 空响应） | `[lesson]` |
| `release.md` | 发布/构建/打包教训详情（发布断链 / 优化慢排查 / src 块编辑坑） | `[lesson]·发布` |
| `user.md` | 用户画像详情（身份/环境/硬件/偏好/习惯） | `[画像]` |
| `agent.md` | agent 自我画像详情（学习史/演化/身份/偏好/习惯） | `[自指]` |

> 本 INDEX 是**子文档注册表 + 条目元数据表**（维护/门禁校验视角）；会话检索入口 = `MEMORY.md`/`USER.md`/`AGENT.md` 索引（按 `→ notes/<file>.md §小节` 路由）。**维护元信息（创建/更新/溯源/状态）只在此表，不进入索引行**（运行时与维护信息分离原则，v11）。

## 维护规则
- 子文档**可写**：Agent 新增详情按分类追加到对应文件，不写回 MEMORY 主篇。
- 只存细节/上下文；**核心事实与相对指针留在 MEMORY**。
- 新增子文档 → 在本 INDEX 加一行，再在 MEMORY 用相对指针引用。
- 子文档同样遵守四问（Q0 已有归属 / Q1 下周用得上 / Q3 能合并），不存红牌内容。

## 条目元数据表（维护视角；索引行不含日期/溯源）

| 主题 | 创建 | 溯源 | 状态 | 备注（最后更新见 CHANGELOG/小节内容） |
|---|---|---|---|---|
| DSH 环境 | 2026-08-13 | agent | active | |
| 全局工程纪律 | 2026-08-13 | owner | active | |
| Zhihu 检索 | 2026-08-13 | agent | active | |
| 职责边界 | 2026-08-13 | owner | active | |
| ZCode | 2026-08-13 | agent | active | |
| MCP | 2026-08-13 | agent | active | |
| 发布打包坑 | 2026-08-15 | agent | active | |
| 网络坑 | 2026-08-13 | agent | active | |
| DSH 自托管约束 | 2026-08-15 | agent | active | |
| dsh 插件更新 | 2026-08-15 | agent | active | |
| WorkBuddy | 2026-08-14 | agent | active | |
| 视觉方案 | 2026-08-14 | agent | active | |
| Cordis 沙箱 | 2026-08-14 | agent | active | |
| prompt-enhancer | 2026-08-15 | agent | active | |
| Windows npm 执行策略 | 2026-08-16 | agent | active | |
| CRLF 坑 | 2026-08-16 | agent | active | |
| 空响应根因 | 2026-08-16 | agent | active | |
| 发布断链 | 2026-08-15 | agent | active | |
| 优化慢排查 | 2026-08-16 | agent | active | |
| src 块编辑坑 | 2026-08-16 | agent | active | |
| 工具链与工具坑 | 2026-09-01 | agent | active | |
| Windows 运维与安全 | 2026-08-22 | agent | active | |
| 模型链路与排障 | 2026-08-23 | agent | active | |
| pmg v3 治理技能 | 2026-09-02 | agent | active | |
| GitHub 发布与同步 | 2026-09-01 | agent | active | |
| 中文用户 | 2026-08-13 | owner | active | |
| Win11+git-bash | 2026-08-13 | owner | active | |
| RTX 2070 SUPER | 2026-08-13 | owner | active | |
| 开源/免费优先 | 2026-08-13 | owner | active | |
| 复刻类项目 | 2026-08-13 | owner | active | |
| 中文短指令 | 2026-08-13 | owner | active | |
| 记忆质量审查 | 2026-08-13 | owner | active | |
| 记忆脚本参数解析坑 | 2026-09-01 | agent | active | |
| 定位演进 | 2026-09-01 | owner | active | |
| 动态 Cordis 插件坑 | 2026-09-03 | agent | active | 归档裁决新增 |
| DSH 插件开发坑 | 2026-09-03 | agent | active | 归档裁决新增 |
| agent preset 机制 | 2026-09-03 | agent | active | 归档裁决新增 |
| 无头浏览器与 shoucang | 2026-09-03 | agent | active | 归档裁决新增 |
| prompt-enhancer 配置坑 | 2026-09-03 | agent | active | 归档裁决新增 |
| DSH 插件生态调研 | 2026-09-03 | agent | active | 归档裁决新增 |
| nssm 服务配置 | 2026-09-03 | agent | active | 归档裁决新增 |
| 记忆插件前置 | 2026-09-03 | agent | active | 归档裁决新增 |
| GUI preset 与内部文档 | 2026-09-03 | agent | active | 归档裁决新增 |
| dsh 实例更新 | 2026-09-03 | agent | active | 归档裁决新增 |
| 记忆体系分工 | 2026-09-03 | agent | active | 归档裁决新增 |
| 插件生产线 | 2026-09-03 | agent | active | 归档裁决新增 |

> 维护规则：新增条目→表加一行（创建/溯源）；小节内容更新→同步更新"备注"或 CHANGELOG；条目指针化/删除→状态改 archived/removed 而非物理删除（历史留痕）。
