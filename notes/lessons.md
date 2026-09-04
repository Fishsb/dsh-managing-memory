# notes/lessons.md — 踩坑教训详情

MEMORY.md `[lesson]` 索引条目的详情。**技能内文件间引用一律相对**；排障数据中的绝对路径（日志/工具）属数据内容。目录可整体迁移。
<!-- 检索定位：node scripts/read_section.mjs notes/lessons.md "小节名"（§=小节名=内容锚，与行号无关） -->

---

## 网络坑（2026-08-13/14，2026-09-03 增补）
- Jina r.jina.ai：匿名 401 需 key；web_search 余额不足 → Invoke-RestMethod 直连 GitHub API（UA 必带）
- raw.githubusercontent.com DNS 失败而 api.github.com 通 → **contents API 取 base64 回退**；pwsh 超时 → v2rayN HTTP 10808
- **Invoke-RestMethod 不吃 HTTP(S)_PROXY 环境变量**（走 .NET 系统代理）→ 显式 -Proxy 或 curl.exe；git clone 失败 → `-c http.proxy=socks5://127.0.0.1:10808` 一次性参数（v2rayN SOCKS5，实战复验）
- 网络三层诊断：HF DNS 污染+TCP 443 阻断；hf-mirror 间歇；ModelScope 稳定；系统代理常关（ProxyEnable=0），SYSTEM 进程默认不走代理

## DSH 自托管约束（2026-08-15，2026-09-03 增补）
- GUI = Windows 服务 dsh-web（nssm，3080）；agent 在 GUI 进程内：**禁自行重启/禁杀端口**，重启由用户手动
- nssm 日志轮转 `AppRotateFiles=1`+`AppRotateBytes=10485760`；3080 发消息冻结=启动时孙进程握管道，处理须异步
- **重启必败即停手转重建**，勿硬编码重启/自愈脚本（失败带半残现场退场）→ 复杂重启交独立 agent；巨型闲置会话可删（曾 348 文件 264MB）

## 动态 Cordis client 沙箱（2026-08-14）
- 全局 fetch/setTimeout 被教学 trap 替换抛错；client 出网须 window.fetch 或 host RPC

## 文本注入构建 CRLF 坑（2026-08-16）
- autocrlf 后 CRLF 使行注释注入标记失配残留 → 构建/提取前统一 `\r\n`→`\n`

## 空响应根因=maxTokens×effort（2026-08-16）
- effort=max 时思考耗尽 maxTokens=2000 → 长输入空流；会话侧不传不触发；缓解 maxTokens≥8000 或 effort 降；deepseek-official 同构

## DSH 工具链与工具坑（2026-09-01/02，2026-09-03 增补）
- pwsh=5.1：无 `??`/`?:`/内联 if（ParserError）；Get-Content 无 -AsByteStream；SYSTEM 身份（LOCALAPPDATA 指向 systemprofile → pnpm store 错 → 一次性改 env）；git dubious ownership → `-c safe.directory=*`
- npm.ps1/pnpm.ps1 执行策略拦截 → .cmd/cmd /c；nodeLinker=hoisted 时版本读顶层 package.json
- `Get-Content -Raw+Set-Content` 默认 GBK 毁 UTF-8 中文源 → 改中文文件一律 read/edit/write；含中文 .ps1 须 UTF-8 BOM
- package.json 带 BOM → JSON.parse 报「锘」→ 剥 `/^\uFEFF/`；pwsh 传 JSON 双引号在 PS→native 边界被剥 → `[char]34` 拼接+回读核验
- **pwsh 的 tar 命中 Git Bash GNU tar 不解 zip** → Expand-Archive 或 System32 tar；**foreach 语句不能直连管道**（先收集数组或 ForEach-Object）
- 大文档导入失败=子进程推理超时被父进程强杀 → **先原样重试一次再深查**
- Git Bash /tmp 与 node 路径不一致 → 跨工具用 Windows 形式或 os.tmpdir()
- Node 坑：正则无 `\z`（静默变字面量）；matchAll 跨行需 /gm；spawnSync 阻塞事件循环（自测服务放独立子进程）
- dsh-library 外接 bge-m3 英文查中文 0 结果（CJK 词法缺陷）→ `search.minRelevance=0` 绕过

## 动态 Cordis 插件坑（2026-09-03）
- 授权链：cordis_define 仅登记（预览不运行），**cordis_run 触发 Web 悬浮面板点允许**（≠工具审批，不点终 cancelled）
- define 报 no dynamic plugin=插件未注入，先查注册再修宿主代码
- 副作用静默失败：fs 写观测文件不可靠 → defineTool 注册自检工具
- 插件开发：UI 槽位占位 id 必须唯一（与基座 Panel duplicate 冲突）；effect 域失败重开报已占用 → 打开前先查（幂等）；**动态插件代码禁 require/import**（宿主依赖不可直引）→ 鸭子类型 shim
- agent-browser 快照会过期：aria-selected 滞后实际 tab；ref 点击无反应≠未绑（ref 非真实元素/快照旧）→ DOM click 后重验快照

## DSH 插件开发坑（2026-09-03）
- UI 槽位占位 id 必须唯一（与基座 Cordis Panel duplicate 冲突）
- effect 域失败后重开报已占用 → 打开前先查已开域（幂等模式）
- 动态插件代码禁 require/import（宿主依赖不可直引）→ 鸭子类型 shim 方案
- engines 兼容检查仅在安装期执行：声明不兼容但 GUI 活着≠兼容

## Windows 系统运维与数据安全（2026-08-22/23，2026-09-03 增补）
- UAC 提权：写盘 → `Start-Process powershell -Verb RunAs -File <脚本>` → 脚本写 DONE → watcher 轮询；非提权扫描严重低估体积（Windows.old 表观 1GB 实释 26GB）
- C 盘清理分类学：可重建缓存直删；个人数据不删；系统组件走提权；增补 LiveKernelReports/NVIDIA 残留/Chrome 缓存（多需管理员）
- nssm 删除规程：确认 → `reg export` → `nssm remove confirm`（勿 sc delete）→ 双核验；AppEnvironmentExtra 整体替换会清空既有环境（配置事故）→ 增量勿整组覆盖
- **nssm 控制台输出本身为 UTF-16**（非 GBK 显示层）→ Out-* 转码后判读；被服务独占的日志用共享读（FileShare.ReadWrite）取证
- 端口主备 dsh-web 3080 + alt 3090；宿主重启脱离进程树=WMI Win32_Process.Create 延时执行；破坏性操作可验证备份（字节数核验才算数）

## 治理漂移根因（2026-09-04）
- 语义失真 check 失明：结构门禁（死链/格式/疤痕词）拦不住「内容与现实矛盾」——ADR v1 旧稿随 v2 提交、计数陈旧、README↔ADR 状态互斥全部放行；reconcile 逐文档重读是唯一语义防线（mtime 驱动、高召回低精度是特性非缺陷）
- 三断点模式：①拍板后只改代码/CHANGELOG 不回写 ADR（commit msg 称 v2 而文件仍是 v1——心智已同步、实际没同步）②同提交先写计数后加用例不回看 ③会话中断截断收尾 → 引擎改动+地图关联成未提交尾巴
- 纪律：拍板即落 ADR；commit 后工作区必净（git status 干净才算收尾）；reconcile 跑完必 --done 重置基线；pmg 可加 README↔ADR 状态一致性机检规则
