# adlc-kit-ts 的 AI 工程化能力走查

一次以「agent 会怎样在这个仓库里工作」为视角的通读：读 `.agents/`、`scripts/`、分层 `AGENTS.md`、安装器与 `docs/`，并实跑 `pnpm run check:all` 取证。结论先说：这不是「用了 AI 工具」的仓库，而是**把 agent 当作一等协作者来设计**的仓库——软约定尽量落成门禁，上下文按预算裁剪，每个决策留下「为什么」。本文是学习复盘，权威以文末链接的文件为准。

> 更新记录：本篇初稿写于同一日，此后又复核了一轮。初稿把「`kit-*` 技能未被 runtime 发现」列为缺口 1；本轮实跑反证了它——本 session 的 workspace root 就是 `adlc-kit-ts`，技能**已被发现并成功加载**。相关段落已改写，并刷新了全部计数（仓库规模、门禁输出）。随后又按外部的「软约束 / 硬约束 / 流程规范 / 管理规范」四维框架复核了一遍，结果见下文章节；该轮的副产品是发现了 `docs/architecture.md` 的门禁清单漂移（缺口 9）。

## 能力矩阵

| 维度 | 载体（权威所在） | 机器强制 | 本次实测状态 |
|---|---|---|---|
| Agent 指令分层 | 根 `AGENTS.md` + `server/` `apps/web/` `packages/` `scripts/` 四个子树 `AGENTS.md` + 5 个 `CLAUDE.md` 别名 | 无，靠纪律 | 5 份指令文件 + 5 个别名符号链接已就位 |
| 决策记忆 | `.agents/notes/{lifecycle}/{class}/` | 分类门禁 + 格式门禁 + 归档哈希门禁 | 7 条英文 Note（14 个文件）全绿，16 条路径可分类 |
| 灵感 / 复盘 | `.agents/inbox/`（`QUEUE.md`）+ `.agents/learning/` | 有意不设门禁 | inbox 1 条 open spark；learning 本篇为首条 |
| 工作流技能 | `.agents/skills/` 下 4 个 `kit-*` `SKILL.md` | 无（skill 自称 guidance，非合同） | 本 session runtime 已收录并可调用 |
| 门禁编排 | `scripts/run-gates.ts` | 是 | 7 个门禁，5.6s 全绿 |
| 校验不变量 | 3 个 `verify-*.ts` + 分类门禁，各带拒绝用 spec | 是 | 8 files / 50 tests 全绿 |
| 分发与采纳 | `packages/create-adlc-kit-ts` | 规划逻辑纯函数 + spec | `new` / `adopt` 双模式 |
| 协作纪律 | 根 `AGENTS.md` 站立命令 + `docs/release.md` | 无，靠纪律与 review | 提交/推送/发版都需显式批准 |
| CI 与钩子 | `.github/workflows/ci.yml` + `lefthook.yml` | 是 | 单 job 跑 `check:all`；pre-commit / pre-push 分工 |

## 五个可复用的设计手法

**1. 上下文预算是显式的工程约束。** 面向 agent 的文件保持纯英文（`AGENTS.md`、`SKILL.md`），面向人的文档才双语——配对门禁也只扫后者。子树 `AGENTS.md` 只写该子树特有的义务、链接依赖的接缝规则而不复述根约定，根文件因此保持精瘦。这是把「模型上下文」当成一种有限资源在管理，而不是把规则越堆越多。

**2. 软约定要被提升为可拒绝的门禁。** 约定是：门禁脚本必须配一个 spec 证明它拒绝一个非法用例，否则算装饰。repo 里 `agent-note-tree`（路径分类）、`verify-agent-note-format`（头部块 / 骨架 / alternatives 强制）、`verify-archived-agent-notes`（append-only 哈希）、`verify-doc-pairing`（配对漂移）都遵守这条。门禁本身只是 `argv`，runner 不解析任何工具链，所以加一条泳道是改数据不是改调度。

**3. 决策记忆强制记录「对手」。** 每个 Agent Note 必须有 `## Alternatives considered`，没有记录对手的决策会招来反复重开争论。配合 lifecycle 目录（`proposed/` `implemented/` `rejected/` `archived/`）与封闭 class 集合，决策的**状态**和**类别**都成了路径的一部分，可被机器分类。

**4. 归档是不可变的。** `archived/` 一旦封存，内容哈希进 `scripts/archived-notes.manifest.json`，任何后续编辑、移动、删除都会挂门禁。这是用 append-only 对抗「agent 顺手改了历史」。

**5. 人类在环的提交边界。** 一次变更以「最窄的相关证据 + 一份汇报」收尾，`git commit` / `git push` 只在当轮用户明确要求时执行；发版切割是同一纪律的上一层。可评审单元是变更本身，而不是一个已经做出的提交。

## 实测证据（2026-09-15，17:17 复核）

```sh
pnpm run check:all   # → run-gates: all gates passed in 5.6s.
```

- `lint`：oxlint 22 files / 101 rules，0 warnings 0 errors。
- `typecheck`：4 个编译面（contracts / server / web / tools）全过，5.6s。
- `test`：vitest 8 files / 50 tests，1.52s。
- `doc-pairing`：14 pair(s) verified。
- `agent-note-tree`：16 path(s) classified。
- `agent-note-format` / `archived-agent-notes`：14 note(s) conform、0 sealed file(s) intact。

规模参考：worktree 88 个文件（86 tracked + 2 untracked；含 5 个 `CLAUDE.md` 符号链接），其中 Markdown 47 个。`scripts/` 973 行 TS / 10 个文件（含 spec）；`server/` + `apps/web/` + `packages/` 合计 516 行 TS（36 / 43 / 437）。**基础设施代码量约为业务代码量的 1.9 倍**——这本身就是「工程化优先」的量化信号。

## 换一个视角：四维框架复核

把仓库放进「面向 AI 的软约束 / 面向测试的硬约束 / 面向项目的流程规范 / 面向团队的管理规范」四维打分。一句话结论：**第一、四维超出了框架的期待，第二、三维却明显欠配**——而欠配的恰好是框架里唯一真正拦得住代码质量的两格（覆盖率、架构守护）。

| 维度 | 框架要素 | 本仓库载体（权威） | 机器强制 | 判定 |
|---|---|---|---|---|
| 一 软约束 | 全局规则文件 | 根 + `server/` `apps/web/` `packages/` `scripts/` 子树 `AGENTS.md`，5 个 `CLAUDE.md` 别名 | 无 | ✅ AGENTS.md 生态；无 `.cursorrules` / Copilot 专属文件；但引用的文件不保证随组件落地（缺口 10） |
| 一 软约束 | Prompt 模板库 | `.agents/skills/` 4 个 `kit-*` `SKILL.md`，随安装器 `workflows` 组件分发 | 无 | ✅ 比 Wiki 更强：版本化 + 可安装 |
| 一 软约束 | 知识库挂载 | `docs/` 三份合同 + 7 条 Agent Note（= ADR）+ 分层索引 | 配对门禁保结构 | ✅ 有等价物（文件注入，非向量库） |
| 二 硬约束 | Lint 严格模式 | oxlint，仅 `correctness: error` | 是 | ⚠️ 无 style / suspicious 类，禁 `any` 未开，无 formatter |
| 二 硬约束 | 覆盖率门禁 | 无 | 否 | ❌ `docs/testing.md` 明确推迟 |
| 二 硬约束 | 架构守护测试 | 无工具；规则写在子树 `AGENTS.md` | 否 | ❌ 只有「首个违规时到达」的声明 |
| 三 流程 | AI Code Review 机制 | 显式提交批准 + 证据后汇报 | 部分（hook 拦 lint / typecheck） | ⚠️ 无 `AI-Generated` 标记、无审计链 |
| 三 流程 | 小步提交 / 原子化 PR | 无 | 否 | ❌ 无 PR 模板、无 PR 体积约束 |
| 三 流程 | 文档同步更新 | `doc-sync` 与代码同一轮执行 | 是 | ✅ 本仓库最强项，且超出框架（框架只要求「流程规定」） |
| 四 管理 | 权责界定 | 「commit / push 只在用户明确要求时」写进根 `AGENTS.md` | 无，靠纪律 | ⚠️ 约束的是 agent 的动作，未点名 AI 代码责任人 |
| 四 管理 | Prompt 资产沉淀 | skills + notes + inbox 队列 + learning 复盘 | 无 | ✅ 机制化，非 Wiki |
| 四 管理 | 安全合规红线 | secrets 不入库（`.env` 忽略、无凭据测试自跳过） | 部分 | ⚠️ 只覆盖「入库」，不覆盖「外发」（数据脱敏）；无 Copyleft 扫描 |
| 四 管理 | 定期复盘 | `.agents/learning/`（本篇即产物） | 无 | ✅ 有载体，无节律定义 |

### 框架没列、但这个仓库做了的两条

1. **决策记忆被机器校验。** 框架的硬约束只管「代码别写坏」；这里的 `agent-note-tree` / `verify-agent-note-format` / `verify-archived-agent-notes` 管的是「决策有没有留下对手、状态与类别是否合法、历史有没有被偷改」。Agent Note 就是 ADR，但比框架建议的「挂到知识库」更进一步：**结构与生命周期本身是红灯**。
2. **复盘被做成产物，而不是会议。** 框架说「Sprint 回顾里加 AI 效能环节」；这里 `inbox/` 是未决灵感队列、`learning/` 是复盘正文，两者都在 git 里、可被 diff、可被链接。代价是没有节律触发，靠人想起来。

### 框架视角下最弱的三格

- **架构守护（ArchUnit 位）。** `apps/web/AGENTS.md` 写着 bundle purity 与 domain graph 两条，措辞是「首个违规时到达」。框架里这恰恰是最该机器化的一格——AI 为「快速实现」破坏分层架构的动机最强，而这里只有文字和 review。
- **覆盖率门禁。** `docs/testing.md` 明确推迟到「先有全局阈值」。当前 50 个测试没有任何比例约束；`scripts/` 973 行对业务 516 行的结构还意味着，覆盖率算出来也不代表业务面被覆盖。
- **来源标记与审计。** 框架要求 PR / commit 标 `AI-Generated`，全仓库 grep 结果为零。这与「提交必须显式批准」不冲突但也不互补：批准回答的是**谁放行**，标记回答的是**事后能不能追溯**。

### 一句话差异

框架把 AI 工程化理解为「约束 AI 的**产物**」；这个仓库把它理解为「约束 AI 的**记忆与决策**，人类守住出口」。所以它最硬的闸在文档与决策上，最软的格正好是框架里唯一能拦住代码质量的那两格——两套思路的缺口刚好互补。

## 缺口与观察

1. **`kit-*` 技能的发现依赖 session 的 workspace root。** 本轮实跑 `skill kit-learning-note` **成功**，目录里 4 个技能全部被 runtime 收录。初稿把它列为缺陷，是因为当时假设 workspace root 是上层 `adlc/`；本 session 的 root 就是 `adlc-kit-ts`，`.agents/skills/` 正在预期位置。因此这不是 `SKILL.md` 合同问题。仍然开放的是**更窄**的问题：以父目录为 root、内部嵌套多个 kit 的 session 会不会去扫子仓库的 `.agents/skills`——这一点本轮未验证。（初稿外链的那条 spark 已在本轮复核期间从工作区消失、`QUEUE.md` 也清空了，故此处不再外链；结论本身不依赖它。）
2. **`archived/` 生命周期是「已建成、零使用」。** `archived/` 目录不存在，manifest 是 `{}`，门禁打印 `0 sealed file(s) intact`。spec 覆盖了它，但没有真实数据走通过端到端归档 + 重录 manifest 的流程。
3. **门禁强制的是文档与决策体系，不是架构边界。** bundle purity、domain graph 这两条写在 `apps/web/AGENTS.md` 里，措辞是「首个违规时到达」；覆盖率门禁、快照泳道、e2e 泳道按 `docs/testing.md` 排在第三步。也就是说，代码结构类不变量目前还是**宣称**，靠 review 而不是靠红灯。
4. **Note 的「存在性」无法被门禁强制。** 「非平凡变更必须带一条 Agent Note」只能靠评审；门禁能校验的是已存在 note 的格式。
5. **结构性配对不是语义配对。** 配对门禁只数 `## ` 标题数与代码围栏数，不校验两侧内容是否真的对应。这是决策里明确记录并推迟的取舍，值得知道边界在哪。
6. **三处成功消息的统计口径都偏宽，绿色数字大于实际校验面。** `verify-agent-note-format` 打印 14 但 `.zh.md` 在函数里提前返回，逐条校验的是 7 条英文；`agent-note-tree` 打印 16 但 README 对被跳过，强制的是 14 条；`verify-archived-agent-notes` 打印的是 manifest 条目数，空 manifest 下「0 sealed file(s) intact」在一件事都没查时也是绿的。非正确性问题，但读绿灯时要自带分母。
7. **骨架三份重复是已记录的代价。** 三个 kit 各自演化、发版 tag 时同步；未来若引入克隆检测门禁需先想好豁免。目前没有这个门禁。
8. **`adopt` 打印前置依赖而不安装它们。** 依赖、`postinstall`、`lint/typecheck/test` 脚本都要采用者手工补齐。这是有意的 fail-loud，但落地摩擦点在这里。
9. **文档合同的「事实」没有门禁保。** 本轮实查：`docs/architecture.md` 的 Gate system 段落仍写 `doc-sync`：双语文档配对（1 条），而实际 `doc-sync` 已有 4 个门禁——v0.2.0 新增的三条 note 门禁只进了 `ChangeLog.md`，没有回填架构图；`docs/architecture.zh.md` 同一句同样漂移。配对门禁只比 `## ` 标题数与代码围栏数，两侧一致所以照常绿灯。这是「门禁保结构、不保事实」的活证据，也是四维框架第三维（文档同步）的真实边界：机器保证了「中英同步」，保证不了「文档与代码同步」。
10. **指令层引用的文件可以不随组件一起落地。** `COMPONENTS` 把 `docs/release.md` / `ChangeLog.md` 归在 `workflows` 而不是 `docs`，于是 `pnpm run create -- adopt . --only rules,docs` 会落下一份根 `AGENTS.md`——它明确链向 `docs/release.md`——而那个文件不在 `docs` 组件里，也没有任何门禁检查「被引用的路径是否存在」。这正好违反根 `AGENTS.md` 自己的 no-silent-skip 原则，只是违反发生在分发层。与缺口 9 同源：**文本指向的东西没人验证**——本篇自己就是活样本：初稿外链的那条 spark 在复核期间被删除，缺口 1 一度成了悬空链接。已连同缺口 9 记入 [inbox](../inbox/2026-09-15-doc-reference-integrity-not-gated.md)。

> 后续（同一 session，缺口 9 与 10 已吸收）：两项已作为 [doc-reference-integrity-gate](../notes/implemented/process/2026-09-15-doc-reference-integrity-gate.md) 实现——`verify-doc-references` 加入 `doc-sync`、架构图漂移与 notes README 的越级链接修正、采纳侧增加组件依赖检查。实现过程中新门禁又查出两个此前不可见的脚手架缺陷（`applyRenames` 会改写 Markdown 链接目标；脚手架链接它有意排除的安装器包），一并修复。**这条观察本身已没有独立价值，此处仅保留为复盘脉络。**

## 对「AI 工程化」的一句话总结

这个仓库最有价值的不是某条规则，而是**把规则变成机器的红灯**的路径：写约定 → 写带拒绝用例的 verify → 挂进 `run-gates` → 让 `check:all` 在本地和 CI 用同一条命令执行。规则可以争论，红灯不能。当前这盏红灯照得最亮的是「文档与决策」，照得最暗的是「架构边界」——这也正是第三步路线图要补的部分。

而本轮最值钱的教训不在仓库里，在复核方法上：初稿的缺口 1 是一条**基于假设而非实跑**的结论（假定 workspace root 在哪），复核一轮就被推翻。凡是关于「runtime 会不会做 X」的判断，都要有一行实跑输出垫底。

## 相关阅读（权威所在地）

- [架构地图](../../docs/architecture.zh.md) · [测试策略](../../docs/testing.zh.md) · [发版合同](../../docs/release.zh.md)
- [根 AGENTS.md](../../AGENTS.md) · [子树 AGENTS.md](../../apps/web/AGENTS.md) · [门禁子树 AGENTS.md](../../scripts/AGENTS.md)
- [Agent Notes 合同](../notes/README.zh.md) · [Inbox 合同](../inbox/README.zh.md) · [Learning 合同](README.zh.md)
- [三阶段路线图 Agent Note](../notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.zh.md)
- [安装器 README](../../packages/create-adlc-kit-ts/README.md)
