# Changelog

> dsh-managing-memory 更新日志。基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added
- 项目建立：会话归档检测插件化改造开发（方案 B），从 managing-memory 技能迁移引擎 + 治理初始化。
- 引擎基线（scripts/）：archive-check（增量+召回）、archive-mark（upsert），含 vendor/fzstd 零依赖解码。
- 治理：docs/map（files 粒度）+ AGENTS.md + pre-commit hook（project-map-governance v3）。
- 开发夹具：notes/ 骨架（小节名与索引对齐）、pending/README、audit/.gitkeep——引擎 13/13 可在项目内回归。
