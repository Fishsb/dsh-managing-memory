# notes/env.md — 环境详情
<!-- 检索定位：node scripts/read_section.mjs notes/env.md "小节名"（§=小节名=内容锚，与行号无关） -->

MEMORY.md `[env]` 索引条目的详情。**技能内文件间引用一律相对**（`notes/<file>.md`）；环境事实数据本身含绝对路径（工具/数据目录）属**数据内容**，不视为指针违规。目录可整体迁移。

---

## DSH 环境（2026-08-13，2026-09-03 增补）
- 数据目录 `C:\Users\lk\.dsh\`；Web GUI http://127.0.0.1:3080；模型 deepseek-v4-flash（opencode-go）；权限 danger-full-access
- checkout：`C:\Users\lk\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh`；宿主机制：`~/.dsh\AGENTS.md` 经 agent-instructions 注入
- 官方 harness 克隆：`D:\FF\deepseek\dsh-dev-docs\deepseek-harness`（blob:none，docs/=官方文档镜像）；端口主备 3080+3090
- 上下文自动压缩默认参数：threshold .8 / retain .16（request-pressure 触发，保留 verbatim-tail）
- **历史会话转录落盘 zstd 压缩不驻内存**；插件投影/统计仅进程内存、重启即失——历史会话分析须读落盘转录
- **DSH 无特权内核**：日志/会话注册表/agent loop 皆插件可替换；组装序 profile→bundle→cordis.patch.yml→--patch；`dsh --profile web --dump-config` 查配置树
- 事件流：message 含 token usage；tool:call/result；request/header 带系统提示词+工具 schema 快照；session/end-seed；插件贡献事件
- agent preset 承载于 `~/.dsh/.agent-presets/agent-core/`（标准模式已松绑零残留）；agent-instructions 只探测 $DSH_HOME/AGENTS.md
- **NODE_OPTIONS 残留 inspector 参数 → node 启动报 inspector failed**，先清再排障
- dsh 命令找不到：npm 全局 bin（%APPDATA%\npm）与 node 须同时在 PATH——dsh.cmd 内部再调 node，只补一环仍失败

## WorkBuddy 与多 Agent（2026-08-14）
- 数据目录 `C:\Users\lk\.workbuddy\`；本体 `D:\Program Files\WorkBuddy\`；增强方案 `D:\lk\deepseek\prompt-enhancer-plugin\方案-v3.md`
- 编制 1+8，门禁 G0-G5，pipeline-tracker 单一权威+回执证据

## 视觉方案（2026-08-14，2026-09-03 增补）
- 主链路 `vision_ask.mjs`（`C:\Users\lk\.dsh\skills\vision\scripts`）+ opencodex 代理 127.0.0.1:10100 + minimax-m3；SideSight 已移除
- **vision-sidecar=vision 别名入口**，共用脚本（仅 vision 有）；保留 vision 为主，sidecar 非独立技能；合并/改名须同步 env.md 指针

## prompt-enhancer 发布（2026-08-15，2026-09-03 增补）
- 发布仓库 `D:\FF\deepseek\prompt-enhancer-release`（main=发布真相）；开发仓库 prompt-enhancer-plugin；构建 scripts/build-client.mjs 用 Hermes node
- 提示词外置（v2.4.6+）：prompts/*.md 为事实源，scripts/sync-prompts.mjs 生成内联——改提示词须重跑
- 发布断链教训：发布物≠运行实例≠tag；发布前 diff 双库、发布后 contents API 实检远端 tag
- **v3.3.1 tgz 包内自带 BOM（源头是包非传输）→ 重装复发**；部署目录被重新解包回退：只改部署目录必被重装冲掉，须修包源头再发布
- git-hosted pnpm 依赖需 allowBuilds；建 Release 须 repo 权限 token；动插件须重启 GUI
- dsh-plugin-hub 把 git+https 解析成 git+ssh（无 key 时 exit 128）→ 显式 URL 带 #main 或先配 key

## Windows npm 执行策略（2026-08-16）
- pwsh 中 npm 报「运行脚本被禁用」→ npm.cmd 或直接 node scripts/*.mjs；ExecutionPolicy 确定性拦 ps1，不绕策略改走替代路径

## nssm 服务配置（2026-09-03）
- nssm 服务环境变量在注册表 **AppEnvironment/AppEnvironmentExtra 两键**（无 Environment 值）——查/改服务环境变量认这两个键

## 记忆插件前置（2026-09-03）
- 本机无 Hindsight 服务器；hindsight 类插件默认指 localhost:888x，先自建服务器才可用

## GUI preset 与内部文档（2026-09-03）
- Web GUI agent preset 四件套：standard/ptc/极简/创造；prompt-enhancer-plugin 项目目录存内部方案文档（提示词优化等），勿外泄
