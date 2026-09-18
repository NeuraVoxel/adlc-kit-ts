# adlc-kit-ts

中文 | [English](README.md)

adlc-kit 系列的 TypeScript 参考 kit：React + Vite 前端、Fastify 后端、pnpm workspaces，以及一套经过门禁验证的工程规范体系（分层 AGENTS.md 指令、`run-gates` 门禁聚合、lefthook 钩子、Agent Note 决策记录）。

## 快速开始

```sh
pnpm install
pnpm run check:ci     # lint + typecheck + test 门禁聚合
pnpm run dev:server   # http://127.0.0.1:3000/health
pnpm run dev:web      # Vite dev server
```

## 在新项目中使用本 kit

仓库本身即模板。在本仓库的克隆中：

```sh
# 脚手架新项目：完整拷贝、改名、钩子就位
pnpm run create -- new ../my-app --scope @myco --name my-app

# 只把验证过的规则采纳进既有项目
pnpm run create -- adopt ../existing-app --only rules,gates,docs,workflows,ci
```

`new` 会拷贝除 `.git`、`node_modules`、构建产物和 lockfile 之外的一切，把 `@adlc-kit/*` 和 `adlc-kit-ts` 改名为 `--scope`/`--name`，并重建 `CLAUDE.md` 别名。`adopt` 不加 `--force` 时拒绝覆盖已有文件，会把缺失的 runner 脚本合并进 `package.json`，并打印门禁所依赖的前置条件。详见[安装器 README](packages/create-adlc-kit-ts/README.md)。

## 目录

| 目录 | 职责 |
|---|---|
| `apps/web/` | React + Vite 前端（浏览器编译面） |
| `server/` | Fastify 后端（Node 编译面） |
| `packages/contracts/` | 跨端契约源；第三步成为生成物家园 |
| `packages/create-adlc-kit-ts/` | 安装器：脚手架新项目或采纳规则 |
| `scripts/` | 门禁编排 runner 与 verify 脚本 |
| `docs/` | 架构地图、测试策略、发版合同 |
| `.agents/notes/` | 决策记录（Agent Notes） |
| `.agents/inbox/`、`.agents/learning/` | 灵感排队（`QUEUE.md` 排队板）与会话复盘 |
| `.agents/skills/` | `kit-*` 工作流技能（inbox 捕获/升格、学习笔记、发版） |
| `.codebuddy/skills/` | 指向 `.agents/skills` 的符号链接别名——CodeBuddy Code 只在此处发现项目技能 |

文档以英文为主档，配 `.zh.md` 中文对照；`pnpm run doc-sync` 拒绝两侧漂移。`AGENTS.md`（面向 agent）仅英文。

## 采纳清单

1. 根 `package.json` 的 `name` 与目录名：`adlc-kit-ts` → 你的项目名。
2. 占位 scope `@adlc-kit/*` → 你的 scope：三个 package 清单，以及 `tsconfig.base.json` 的 `paths`。
3. 替换示例端点 `GET /health` 与 `apps/web/src/App.tsx`。
4. 添加 git remote；`.github/workflows/ci.yml` 已按 pnpm + Node 22 配好。

`new` 命令会自动完成第 1、2 步和第 4 步的改名。

## adlc-kit 系列

`adlc-kit-ts`（本仓库，第一步）→ `adlc-kit-py`（Python 单栈，第二步）→ `adlc-kit`（集成形态，第三步）。组合规则见[路线图 Agent Note](.agents/notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.md)。
