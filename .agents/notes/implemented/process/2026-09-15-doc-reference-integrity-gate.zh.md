# Agent Note: Gate the reference integrity of the documentation and instruction layers

Status: implemented

## Problem

本仓库强制了文档的**结构**，却从不校验它**指向的东西是否存在、是否还是那样**。同源的两个实例都以绿灯通过了 `pnpm run check:all`：

- **事实漂移。** `docs/architecture.md` 与 `docs/architecture.zh.md` 把 `doc-sync` 描述为只有双语文档配对，而 `gatesForMode('doc-sync')` 返回四条门禁；v0.2.0 新增的三条 Agent Note 门禁只进了 `ChangeLog.md`，从未回填架构图。`verify-doc-pairing` 只比 `## ` 标题数与围栏行数，两种语言一起漂移就照样绿灯。
- **悬空引用。** `COMPONENTS` 把 `docs/release.md` 与 `ChangeLog.md` 归在 `workflows` 组件而不是 `docs`，于是 `adopt --only rules,docs` 会装下根 `AGENTS.md`——它链向 `docs/release.md`——却装不下被引用的文件。

两者都违反根站立命令「never silently skip a missing referent」，只是违反点落在文档层与分发层，而不是代码层。这一类已经复发两次，正好到达本仓库把软约定提升为门禁的阈值。

由 inbox spark [doc-reference-integrity-not-gated](../../../inbox/2026-09-15-doc-reference-integrity-not-gated.md) 升格而来；触发它的走查是 [AI 工程化能力](../../../learning/2026-09-15-ai-engineering-capabilities.md) 的缺口 9 与缺口 10。

## Decision

`scripts/verify-doc-references.ts` 作为该不变量的门禁加入 `doc-sync`：配对语料中每一条仓库内相对 Markdown 链接都必须解析到真实存在的路径，且不得逃出仓库。语料与豁免规则直接从 `verify-doc-pairing` 导入而非重新推导，两条门禁因此不可能对「什么是文档语料」产生分歧。外链、协议相对目标、纯锚点，以及写在行内代码或围栏代码块里的路径都在范围之外——写在代码里的路径是示意，不是指涉物。成功行报告的是实际检查过的引用数，而不是语料规模。

同一变更修掉了门禁查出的问题：

- 架构图在两种语言里都列出 `doc-sync` 的全部五条门禁。
- notes README 对的门禁链接原先指到了仓库根的上一级，现已解析正确。

被分发的指令层按组件集合自洽：`COMPONENT_REQUIRES` 声明 `rules` 的指涉物分布在 `docs`、`workflows`、`ci`，`adopt` 在写入任何文件之前拒绝不完整的组件选择，并点名承载缺失指涉物的组件。`lib.spec.ts` 从 `AGENTS.md` 实际发出的链接重新推导这张表，使它无法漂移。

门禁还查出两个脚手架缺陷，一并在本次修复，因为「门禁会让产品自己的产物变红」是不可交付的：

- `applyRenames` 会改写 Markdown 的**链接目标**，于是脚手架指向 `2026-09-15-create-smoke-installer.md` 与 `packages/create-smoke/README.md`，而磁盘上的文件仍保留原名。链接目标是路径而非行文：现在予以保留，链接文字仍照常改名。
- 脚手架会链接它有意排除的安装器包。`pruneExcludedReferences` 把目标被排除的链接拆成纯文本，保留文字、去掉引用。

## Alternatives considered

- **什么都不做，靠 review 兜。** 否决：review 已经漏掉这两个实例，而 `check:all` 当时报了七条绿灯；配对门禁在构造上看不见内容漂移。
- **把 `verify-doc-pairing` 加强到比对章节标题。** 否决：它能抓到架构图漂移，只是因为这**两**份文件恰好共享了同一个过时标题。它无法校验链接目标，也无法校验被安装的组件子集；加宽那条门禁等于重开一个 pairing README 已记录为有意取舍的范围。
- **上完整的链接检查器，含外链。** 暂缓：那会把网络依赖与抖动引进一条必须确定性、离线的门禁，而已知缺陷都不涉及外链。
- **把被引用的 Agent Note 一起分发，让采纳后的仓库也变绿。** 暂缓：采用者本就被告知要剪掉 kit-history 行，而分发 kit 决策记录会改变 `adopt` 交付的内容——那是一个本次变更不该顺手做出的产品决策。代价记录在下方。
- **把组件指涉物写进安装器 README 而不是门禁化。** 否决：与其他「只靠 review」的方案同一个失败模式；`packages/AGENTS.md` 已要求组件变更动四处，这等于再加第五处无人校验的地方。

## Consequences

证据。`pnpm run check:all` 在八条门禁下全绿；`doc-references` 报告的是配对语料里它实际检查过的引用数。`lib.spec.ts`（16 个测试）从 `AGENTS.md` 重新推导组件依赖表，并证明 `rules,docs` 会被拒绝；`verify-doc-references.spec.ts`（10 个测试）证明门禁拒绝悬空引用、逃逸引用，并忽略代码片段。真实采纳冒烟显示：`--only rules,docs` 退出码 1、报 `rules needs workflows, ci` 且**零文件写入**；完整选择装下 51 个文件；全新 `new` 脚手架通过被分发的门禁，而在此之前它在四条引用上失败。

代价与仍然开放的边界：

- 采纳后的仓库会一直因为 kit-history 链接（`docs/*.md` 里对单条 Agent Note 的引用）而红，直到采用者把它们剪掉；adopt 的 next steps 与安装器 README 都写明了这一点。把被引用的 Note 一起分发能消除它，代价是每份采纳仓库都背上 kit 的决策历史。
- spark 文件、学习笔记与 `AGENTS.md` 不在语料内：前两者是有意不设门禁的用户内容，指令层则由组件依赖检查负责。因此「Note 迁移 lifecycle 后修复入链」仍然是一项手工义务。
- 脚手架的架构表仍列着被排除的安装器包。它是表格单元里的行文而非链接，没有门禁能看见，靠文档适配覆盖。
- kit 骨架有三份副本，所以这条门禁只在这里生效，除非姊妹 kit 在下一次 tag 同步时一并采纳。
