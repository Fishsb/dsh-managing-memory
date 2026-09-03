# notes/release.md — 发布/构建/打包教训详情

MEMORY.md `[lesson]` 发布类教训的详情。发布/交付流程的踩坑归本文件，与 `tools.md §发布打包坑`（打包命令）、`env.md §prompt-enhancer 发布`（环境组件）区分：**本文件是发布流程教训**。技能内引用相对；数据中绝对路径属内容。
<!-- 检索定位：node scripts/read_section.mjs notes/release.md "小节名"（§=小节名=内容锚，与行号无关） -->

---

## 发布断链再例：v2.4.4 修复在 v2.4.5 无记录回退（2026-08-15，v2.4.8 修复）
- 现象：v2.4.4 修复（sidebar.footer.action 占位 id）在 v2.4.5 被无记录改回旧值；本机 GUI 运行实例却是修复版 → **发布物 ≠ 运行实例 ≠ tag**
- 根因：双库 copy 基于旧基线带回旧文件/回退未记录；更新插件后重启 206 连崩（EADDRINUSE+sqlite invalid config）=cordis.patch.yml `!!js dshHomePath` 插值偶发失败 → path 缺失 fail-loud；nssm 无 AppExit=崩溃无限重启放大
- 修复：删条目回退官方默认（:memory:+openAt never）；nssm 配 AppExit\1=Exit；排查先看 dsh-web-err.log（plugin tree failed to load 特征）；系统日志 7036=服务级启停（nssm 应用级重启不产生）

## staging 缺 tgz 断链（2026-09-03 增补）
- dshmarket 更新报 tarball 损坏/null **实为 staging 缺 tgz（报错≠结论）**；lockfile file:/link: 依赖缺一个 → 全部 pnpm/npm install 失败
- 补回=GitHub Release 重下原位 + SHA256 校验；tgz 源头自带 BOM（v3.3.1）重装复发 → 修包源头再发布（与 env.md §prompt-enhancer 发布互参）

## prompt-enhancer 优化慢排查（2026-08-16 实测）
- 诊断源 dsh-web-out.log（hlog 无时间戳，环形 300 行经 GUI 诊断日志读）；`models/test`=maxTokens 16 短输入 → **可用≠增强可用**
- 长输入+builtin 长模板 → EMPTY_RESPONSE → quota×2 → pro → 30s 超时静默（TIMEOUT 分支不写 hlog）；CRLF 防御 build 已内建勿重复实现

## prompt-enhancer src 块编辑坑（2026-08-16 实测）
- `src/host/*.js` 单行字符串模块：行分隔为字面转义（pure.js `\r\n` 4 字符、其余 `\n` 2 字符）；嵌入代码反斜杠双写；改 host 必改 src 再 build（plugin-host.js/lib 为生成物）；补丁按转义形态匹配+幂等
- 块级事件通道：sessionQuery.readSurface（listEvents 无文本、filterEvents 预拼接）；轮次= user 锚点到下一条 user，窗口从最近往旧

## GitHub 发布与市场同步（2026-09-01/02，2026-09-03 增补）
- **框架同步 SOP**：cp 框架文件 → README 留公开库版 → 私密扫描 → push main（不建 release/tag）
- **OSS 全新发布 SOP**：gh repo create --public --push → 发布套件（README 双语/LICENSE/CHANGELOG/.gitattributes eol=lf）→ npm pack（files 含 gitignore 的 lib）→ gh release create --target main（自动打 tag）
- 凭证坑：push 卡住≠网络（先 ls-remote 秒回排除）→ credential.helper=manager 无 TTY 弹窗 → gh auth setup-git + GIT_TERMINAL_PROMPT=0
- **fork main 与上游分叉无法快进 → Git Data API 服务端直接建分支**（不经 push，绕 workflow scope）
- **市场同步**：新功能须同步各第三方市场 About/描述（实测不同步）；市场挂旧文本=分发链路快照，改仓库描述不够，须逐市场更新
