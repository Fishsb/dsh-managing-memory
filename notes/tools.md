# notes/tools.md — 工具配置详情
<!-- 检索定位：node scripts/read_section.mjs notes/tools.md "小节名"（§=小节名=内容锚，与行号无关） -->

MEMORY.md `[tool]` 索引条目的详情。**技能内文件间引用一律相对**；工具配置数据中的绝对路径（安装目录）属数据内容。目录可整体迁移。

---

## Zhihu 检索（2026-08-13）
- zhihu-cli 0.2.0：`%LOCALAPPDATA%\ZhihuCLI\current`，密钥链已配
- zhihu-toolkit 0.1.0：venv `D:\lk\venvs\zhihu-toolkit`

## ZCode = 智谱 Z.AI 编程（2026-08-13）
- `zcode.cjs` v0.16.3 @ `D:\Program Files\ZCode\resources\glm\`，Z.AI OAuth，`--prompt` 无头可编程子代理
- 配置「全部丢失」根因=新建空默认配置覆盖原配置；排查先找空默认配置来源，确认无用可清理（2026-09-03 实证）

## MCP（2026-08-13）
- bilibili：`D:\lk\tools\bilibili-mcp-js`（工具仅新会话注入）；godot-ai 禁用；hermes-studio 四件套

## 发布打包坑（2026-08-15，v2.4.8 实况）
- pnpm/npm 的 .ps1 被执行策略挡 → `cmd /c "npm pack"` 绕行（产物等价）
- `gh` 在 MinTTY 报无伪终端 → 前置 `$env:GH_FORCE_TTY='0'`
- `git archive | tar` 管道损二进制 → `git archive --format=tar --output=<f> <tag>` 再解
- 历史 tag 补资产：tag 版本=tag 名即可 `npm pack` + `gh release upload`
- sync-prompts `--check` autocrlf 假阳性 → 先跑写模式重写再 `git diff` 验证
- pwsh `git diff` 大输出经管道被当单字符串炸屏 → 先重定向文件再用 read 读
- pwsh `gh api 2>&1 | ConvertFrom-Json` 混流报错被吞 → 依赖 `$LASTEXITCODE`、分开捕获、先看原始输出
- 已删 PR：`gh pr list` 不可见，`git ls-remote` 仍见 refs/pull/N → fetch 到 FETCH_HEAD 审查
- pnpm 装带构建脚本的 git 依赖默认拒建：在 pnpm-workspace.yaml 的 allowBuilds 列入该键；无 prepare 则无 lib，作者须提供构建产物；最稳避免 git，走 registry 直装后自检装载并配置转储。

## 模型链路与排障（2026-08-23/24，2026-09-03 增补）
- llm-pi 自定义 provider：键不在内置目录则模型元数据缺失（默认 262144 不可信）→ 只放新增模型并逐个补元数据
- reasoningEfforts 档位按同族推断后必须实测；改 settings.yaml 前备份、重启后真实调用验证；硬规则：未经用户指令不改端口/模型配置
- 断连防护：用户中断=唯一合法终止；上游故障=可恢复持续重试不丢进度；retryPolicy always 会无限重试 4xx/5xx，排障先关
- Zen Go 三协议（opencode.ai/zen/go/v1）：completions=Bearer 最广；messages=唯一强制 x-api-key；responses 仅 grok-4.5/deepseek-v4-pro；models 公开无认证
- zen-proxy.cjs（`D:\lk\deepseek\tools\zen-proxy.cjs`）解决地区受限模型
- 供应商验真：按模型自报身份核对（hy3 PING_OK 却自报 deepseek-chat=挂靠转发）；批量连通假超时=workflow 排队/冷启动，8s 重跑全通再定性
- Flash 模型链不接 PTC；dsh-router-flash 打包在 xiaoxianyu-office/dsh-router-flash
- dsh-library 嵌入已由哈希切外接 bge-m3（1024 维，cordis.patch.yml 热重载生效）；中文查英文库 0 命中=跨语盲区（已复验），0 结果先怀疑跨语/库形态，勿误判代码故障

## pmg v3 治理技能（2026-09-02，2026-09-03 增补）
- 唯一副本 `C:\Users\lk\.dsh\skills\project-map-governance`；v3 规则引擎 governance.json（10 规则）；命令 init/sync/check/adr/status/reconcile/devref/mcp
- 已知缺陷：check/sync 忽略规则不对称（init IGNORE_NAMES 不含 .mnemon 等点目录、sync 跳全部点目录）→ 单向误报漂移；check 只认仓库根相对路径；.gitmodules 裸词被跳过永标漂移；改写基准=~/.dsh 版
- 粒度选型=变更频率比文件数更关键，少变更项目 files 即可；roots 未配置时其余目录仍入 check，需配置兜底
- 三层形态：脚本引擎（pre-commit）+ DSH 插件（6 原生工具）+ MCP；发布 Fishsb/dsh-project-map-governance v0.1.0

## agent preset 机制（2026-09-03）
- 出厂 preset yml 在包内 `config/agent-presets/`（乱码=GBK 被当 UTF-8 读，非损坏）：standard 全能 / code=PTC·CodeModeSDK / 极简=bash+str_replace 双工具 / 创造=+cordis 实验与 preset 创作
- 会话内对未装插件执行 update 必败（无 current）→ 改 install/run 或先确认替代动词

## 无头浏览器与 shoucang（2026-09-03）
- Edge headless 启动静默失败（exit 234 无输出）→ 改系统 Chrome+puppeteer-core 截图；开态点击被全屏遮罩吞 → 开→关→开精确序列取落单态证据
- shoucang spec_reader：缺 PyYAML 时 registry.yaml 静默回退默认配置（表面正常）→ 异常先查 stderr 与 yaml 模块，`pip install pyyaml`

## prompt-enhancer 配置坑（2026-09-03）
- 配置多层合并（存储/面板/patch，patch 优先）→ 排障先对齐各层生效值；maxTokens 过小致长输入空流（8000 恢复）；`models/test` RPC 实测整链

## DSH 插件生态调研（2026-09-03）
- awesome-dsh-plugin.com 1884 插件（memory 类 97）：无值得整体替换现有记忆组合的方案；镜像元数据无 README → 目录站 readmes.json 快照取说明
