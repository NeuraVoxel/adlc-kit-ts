# adlc-kit-ts

adlc-kit 系列的 TypeScript 单栈参考 kit：React + Vite 前端、Fastify 后端、pnpm workspaces，内置一套「软约束 → 硬门禁」的工程规范体系（AGENTS.md 分层指令、run-gates 门禁聚合、lefthook 钩子、Agent Note 决策记录）。

## 快速开始

```sh
pnpm install
pnpm run check:ci     # lint + typecheck + test 门禁聚合
pnpm run dev:server   # http://127.0.0.1:3000/health
pnpm run dev:web      # Vite dev server
```

## 目录

| 目录 | 职责 |
|---|---|
| `apps/web/` | React + Vite 前端（浏览器编译面） |
| `server/` | Fastify 后端（Node 编译面） |
| `packages/contracts/` | 跨端契约源；第三步成为生成物家园 |
| `scripts/` | 门禁编排 runner 与 verify 脚本 |
| `docs/` | 架构地图与测试策略 |
| `.agents/notes/` | 决策记录（Agent Notes） |

## 采用本 kit（改名清单）

1. 目录名与根 `package.json` 的 `name`：`adlc-kit-ts` → 你的项目名。
2. 占位 scope `@adlc-kit/*` → 你的 scope：`server/`、`apps/web/`、`packages/contracts/` 的 `package.json`，以及 `tsconfig.base.json` 的 `paths`。
3. 健康检查端点 `GET /health` 与样例组件 `apps/web/src/App.tsx` 按需替换。
4. 添加 git remote；`.github/workflows/ci.yml` 已按 pnpm + Node 22 配好。

## adlc-kit 系列

`adlc-kit-ts`（本仓库，第一步）→ `adlc-kit-py`（Python 单栈，第二步）→ `adlc-kit`（跨栈集成形态，第三步）。组合规则与路线图见 [Agent Note](.agents/notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.md)。
