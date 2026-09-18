# Agent Note: CodeBuddy Code 的技能发现别名

Status: implemented

## Problem

`kit-*` 工作流技能住在 `.agents/skills/<name>/SKILL.md`：一棵树、一个家园，被所有读取本仓库的 agent 工具共享。而 CodeBuddy Code 只在 `.codebuddy/skills/<name>/SKILL.md` 下发现项目技能，因此在本仓库里它一个技能都没加载到——技能存在，`AGENTS.md` 与 README 对照档也写了它们，却在真正驱动本 kit 的工具里不可达。桥接方式不能移动技能、也不能复制内容：两者都会给同一批事实第二个家园，并破坏安装器的 `workflows` 组件。

## Decision

`.codebuddy/skills` 是指向 `../.agents/skills` 的单个相对符号链接。技能只在 `.agents/skills/` 下撰写与修改；别名本身从不编辑，也不承载任何文件。`packages/create-adlc-kit-ts/bin.ts` 在 `new` 与 `adopt` 之后重建该别名，理由与重建 `CLAUDE.md` 相同：`fs.cp` 会把复制的符号链接物化回指向源仓库的绝对路径。`adopt` 只在目标确实存在 `.agents/skills` 时建链（绝不留下悬空别名），会替换已存在的符号链接，但保留真实目录——目标项目可能拥有本 kit 不提供的技能。

## Alternatives considered

- **把技能搬到 `.codebuddy/skills/` 并废弃 `.agents/skills/`。** 落选：这棵树是工具中立的，而且一切都已指向它——技能自身的相对链接（`../../inbox/README.md`）、`docs/release*.md`、`README.md` 以及安装器的 `workflows` 组件都要跟着改；下一个自带发现目录的工具会重演同一场迁移。
- **每个技能一个符号链接（`.codebuddy/skills/<name>`）。** 落选：新增技能变成两次编辑，漏掉第二次就静默不可见；一个目录链接覆盖整个技能族，现在与将来都算在内。
- **在 `.codebuddy/` 下放薄转发 `SKILL.md`。** 落选：`name` 与 `description`——模型据以匹配技能的字段——会同时存在于两处并漂移，这正是「一个事实一个家园」要防的重复。
- **复制 `SKILL.md` 文件。** 同样的重复，而且更糟：没有任何机制让副本保持同步。
- **只记录这个缺口，让 CodeBuddy 用户自行配置发现路径。** 落选：本 kit 自己的工作流技能会在运行它的工具里继续不可达。

## Consequences

CodeBuddy Code 现在列出四个 `kit-*` 技能，而技能撰写方式不变。随之而来两条义务：新技能只放进 `.agents/skills/`——别名会自动覆盖它，而在 `.codebuddy/` 下新增真实文件等于第二个家园，且会被别名遮蔽；凡是改动安装器处理符号链接方式的地方，都要继续重建这个别名，与约束 `CLAUDE.md` 的相对链接规则一致。在不支持符号链接的环境里，安装器退化为复制整棵树，此后新增的技能不再被跟踪：这是回退方案的已知代价，而非别名的代价。
