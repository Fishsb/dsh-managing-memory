# 候选：治理漂移根因模式（文档语义失真 check 查不出，reconcile 兜底）

## 主题
pmg 治理项目出现「文档与现实语义矛盾但 check 全绿」的漂移：ADR-0002 提交信息称 v2、文件内容是 v1（人工终审 vs 实际已运行的无人工环）；decisions/README 状态列 proposed vs 文件 accepted；用例数文档 13/22 vs 实际 23；引擎改动（removePending rename 隔离）+ 地图关联滞留工作区未提交。

## 要点
- 决策拍板后只改代码/CHANGELOG，ADR 文件不回写 → commit msg 描述意图、文件是旧稿（作者以为已同步）
- 同提交内部漂移：先写「22 用例」后同一提交加第 23 个测试，最终数没回看
- 会话中断 → 最后一轮改动（代码+地图关联）成未提交尾巴，收尾清单未执行
- check=结构校验（死链/格式/疤痕词），跨文档语义矛盾不在规则表，天然失明
- reconcile 是唯一语义防线：mtime 驱动、高召回低精度（sync 刷派生文件也进清单），靠 agent 重读兜底——本次正是它抓住 ADR 矛盾
- 改进候选：pmg 可加规则——decisions/README 状态列 vs ADR 文件状态行一致性（可机检）

## 四问
1. 值得记？是：pmg 治理项目通用的事故根因链
2. 可复用？是：三条防线（拍板即落 ADR / commit 后工作区必净 / reconcile 跑完 --done）
3. 放哪？notes/lessons.md 新小节「治理漂移根因」+ MEMORY.md 新索引行
4. 何时过时？pmg 加 README↔ADR 状态一致性规则后，机检部分可简化

## 拟落点
- notes/lessons.md §治理漂移根因（新小节）
- MEMORY.md 新增：`[lesson] 治理漂移根因 · 语义失真check失明/reconcile兜底 → notes/lessons.md §治理漂移根因`

## 溯源
本仓 2026-09-04 治理体检（修正提交 6d26213；根因时间线取证自 c87e27b 与插件日志）
