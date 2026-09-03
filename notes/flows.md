# notes/flows.md — 流程详情
<!-- 检索定位：node scripts/read_section.mjs notes/flows.md "小节名"（§=小节名=内容锚，与行号无关） -->

MEMORY.md `[flow]` 索引条目的详情。**技能内文件间引用一律相对**；流程数据中的绝对路径（仓库/脚本）属数据内容。目录可整体迁移。

---

## 全局工程纪律（2026-08-13）
- Conventional Commits / ADR·Spec 先行 / DoD 六项 / 模块拆分 / 数据分层

## 职责边界（2026-08-13）
- 通用检索 / 环境诊断 / 系统维护归本 Agent；写作 / 拆书类拒收

## dsh 插件更新（2026-08-15，2026-09-03 大幅增补）
- `dsh plugin --profile web <pnpm args>`=转发 pnpm；bundle 更新须重启生效（web 禁 hmr）；重启 `net stop/start dsh-web`（agent 禁自重启）
- pwsh 里 dsh 被执行策略挡 → `node <npm>\@deepseek-ai\dsh\lib\bin.js plugin ...` 直跑
- sqlite 搜索官方默认关闭（`:memory:`+openAt never）；要开内容搜索覆盖 openAt，path 用字面路径勿 `!!js dshHomePath`（插值失败杀进程）
- 官方插件开发文档：docs/cordis-tutorial、cookbook/extension-cookbook、cordis-api
- `file:` 本地插件在 node_modules 有独立硬拷贝，改源须同步副本；`link:` 依赖无此问题
- peer junction 必须建在插件包内 `node_modules/@deepseek-ai` → 宿主（ESM realpath 祖先链）；pnpm reify 清手建 junction → 先装后建，装完冷启动复验
- HMR 装载闸=cordis.patch.yml 的 patch disabled 行（settings enabled 不是）；dshmarket UI 启停=写 disabled 行+HMR
- 装机一律官方 CLI `dsh plugin add`（同步 deps+bundles+lockfile）；dshmarket 手装漏 bundles；lockfileToHoistedDepGraph 崩 → 先 `pnpm install --frozen-lockfile`
- duplicate loader entry id 启动崩溃（patch 写两次/重复安装）→ 现成工具 `dev_fix_patch` 扫 profiles/*/cordis.patch.yml 按 id 去重（--check 只查不写）
- peer-shim junction 指旧副本劫持 client 解析（GUI 全端报错）；glob 不穿 junction 易误判唯一副本；修=junction 重指+覆盖 registry 缓存 clientPath（serveBundle 每请求读盘免重启）；排障=__DSH_BOOT__ rev 对照磁盘 sha1_12
- **安装授权**：依赖带构建脚本 → profile `pnpm-workspace.yaml` 补 `allowBuilds:` 后重启；git-hosted 须授权、发布版/tarball 免 → 勿 git+ 装；装后两证=自检装载+转储入 profile
- **故障排查配置链**：web profile 的 cordis.yml/cordis.patch.yml/settings.yaml/pnpm-lockfile/各插件 package.json 比版本找变更；GUI 运行中防并发更新
- **生产线**：scaffold 未 build 即注入 → failed to import（先查 lib/index.js）；dev_self_test 首步 checkout 探测失败=环境无 DSH_CHECKOUT 属预期非 bug
- **junction 遮蔽**：插件目录缺依赖遮蔽宿主包致启动失败 → junction 重指宿主（dev_heal_links 自愈）
- engines 兼容检查仅 `dsh plugin add` 安装期执行，运行期不杀进程——声明不兼容但 GUI 活着≠兼容（重启评估交用户）

## dsh 实例更新（2026-09-03 alpha SOP）
- 宿主更新必用 Hermes npm（会话 npm prefix=.workbuddy 无效）；alpha.3 幽灵 devDep 必 E404 → curl 走 10808 下 tgz+剥 devDeps+rename 原子换位留 .bak 秒回退
- MSYS tar 把 C: 当主机名 → System32 tar.exe；nssm 显示 Stopped 但 GUI 手动进程在跑 → 端口以 Get-NetTCPConnection 为准

## 记忆体系分工（2026-09-03）
- 多记忆插件并存曾混乱（mnemon 已卸载、layered-memory 已弃）→ **managing-memory 唯一承载**；管理式记忆存「为什么」（决策/教训/约定），图谱存「是什么」（结构/流程）
- mnemon 迁移：无整体导出 → 整根复制 `.mnemon` 存储根再切 scope（--data-dir 全局旗标）；嵌入支持 hash/外部命令双模式，可接本地 bge-m3 升级语义检索；全程热操作不重启

## hindsight 部署（2026-08-15）
- market 版默认连 Cloud 无 token → reflect 401 → 本地 backend + 工具环境变量需传递给 pwsh

## 插件生产线（dev_* 工具，2026-09-03）
- dev_scaffold → dev_build → dev_inject 三步；详细坑（槽位 id 唯一/域幂等/动态插件禁 require/engines 时机）→ `notes/lessons.md §DSH 插件开发坑`
