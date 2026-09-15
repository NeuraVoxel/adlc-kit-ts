# Inbox: 文档与指令层的引用完整性没有门禁

Status: promoted → [Agent Note](../notes/implemented/process/2026-09-15-doc-reference-integrity-gate.md) · [中文](../notes/implemented/process/2026-09-15-doc-reference-integrity-gate.zh.md)

## Spark

走查 AI 工程化能力时发现两个同源实例，都是「文本指向某个东西，但没有机器检查那个东西是否存在 / 是否还是那样」：

1. **事实漂移。** `docs/architecture.md` 与 `docs/architecture.zh.md` 的 Gate system 段落仍写 `doc-sync`：双语文档配对（1 条），实际 `doc-sync` 已是 4 条——v0.2.0 新增的三条 Agent Note 门禁只回填了 `ChangeLog.md`，没回填架构图。配对门禁只比 `## ` 标题数与代码围栏数，两侧一起漂移照样绿灯。
2. **悬空引用。** `COMPONENTS`（`packages/create-adlc-kit-ts/lib.ts`）把 `docs/release.md` / `ChangeLog.md` 归在 `workflows` 组件而不是 `docs`，于是 `pnpm run create -- adopt . --only rules,docs` 会落下一份根 `AGENTS.md`，其中链向并不存在的 `docs/release.md`。没有任何门禁检查「被引用的路径是否存在」。

两者都撞上根 `AGENTS.md` 的 no-silent-skip 原则（never silently skip a missing referent），只是撞点在文档层与分发层，而不在代码层。

## 可能的方向

- 窄的：给 `adopt` 的组件集合加一条 spec——指令层引用的文件必须同批安装（`rules` 依赖 `workflows` 的 release 文档）。
- 宽的：一条 `verify-doc-references`，扫 `*.md` 里的相对链接与围栏内的仓库路径，拒绝悬空引用；注意 `AGENTS.md` 是英文单语豁免面，规则要写清豁免理由。

参考学习笔记：`.agents/learning/2026-09-15-ai-engineering-capabilities.md` 的缺口 9、缺口 10。
