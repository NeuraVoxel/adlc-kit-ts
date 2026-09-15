# Agent Notes

Agent Note 记录影响本仓库的决策——*为什么*、*放弃了什么*，即代码和文档承载不了的部分。会话纪要和学习笔记不属于这里。

## 布局与命名

路径编码两个轴：`{lifecycle}/{class}/yyyy-mm-dd-topic.md`

- **lifecycle**（顶层目录）是状态，随状态移动：
  - `proposed/`——已评审、未实施的提案。
  - `implemented/`——决策已上线；文件记录决策与被否决的替代方案，并**与实际交付保持同步**：代码后续移动文件、改名、改默认值时，同一变更内更新对应事实（只改事实，不改决策本身）。
  - `rejected/`——考虑过并否决；仅在其理由还能防止一个可能犯的错时保留，否则整组删除。
- **class**（嵌套目录）是决策类别，封闭集合：`feature` / `bug-fix` / `simplification` / `architecture` / `process` / `testing`。新增类别需先改本节。

日期是主题**首次提出**的日期（以 git 历史为准）。Note 之间用相对 Markdown 链接互引，不用裸文件名或编号。

## 何时写一条

每个**非平凡变更**必须同一 PR 内新增或更新至少一条 Agent Note：改变行为、架构、跨文件或跨包共享的契约、流程或工具、测试策略、磁盘/wire/配置格式，或任何维护者可能需要重新审视的决策。已在实施的 Note 随代码迁移/改名/改默认值在同一变更内同步。纯机械或局部修改豁免。Note 永不改写成*另一个*决策：用新 Note 取代并互链。

## 文件格式

前三行固定：

```markdown
# Agent Note: <标题>

Status: <status>
```

`Status:` 取 `proposed`、`implemented` 或 `rejected — <一行理由>`，且必须与所在 lifecycle 目录一致。

正文以 `## Problem` 开头（只写动机，脱离方案也能读懂）：

- `proposed/`：`## Proposal` → 自由章节 → `## Alternatives considered` → `## Acceptance criteria` → `## Risks`。
- `implemented/`：`## Decision`（现在时，写已交付的现实）→ 自由章节 → `## Alternatives considered` → `## Consequences`（代价与收益都记）。提案期的 `## Proposal` / `## Acceptance criteria` 章节名在 implemented 里不被接受。
- `rejected/`：保留提案原样，裁决写在 `Status:` 行。

### Alternatives considered 强制存在

每个 Note 必须携带 `## Alternatives considered`：每个真实替代方案及落败原因。没有记录对手的决策会招来重新争论——这正是 Note 存在要防止的事。

格式门禁（`verify-agent-note-format`）在本仓库出现第一批格式漂移后再引入；当前靠评审执行本节。
