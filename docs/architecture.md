# 架构

adlc-kit-ts 是 adlc-kit 系列的 TypeScript 单栈参考 kit。本文是改动 `server/`、`apps/web/`、`packages/`、`scripts/` 前的必读地图；决策理由在 [.agents/notes/](../.agents/notes/README.md)，逐步操作指南不在本文。

## 组成

| 目录 | 职责 |
|---|---|
| `apps/web/` | React + Vite 前端；浏览器编译面（bundler resolution、DOM lib），产物禁 Node API |
| `server/` | Fastify 后端；Node 编译面（NodeNext），tsx 直接执行 TS，暴露 `GET /health` |
| `packages/contracts/` | 跨端契约源。第三步成为生成物家园（gen/verify 成对 + 双端 same-PR），现阶段手写共享类型 |
| `scripts/` | `run-gates.ts` 门禁编排与 verify 脚本；语言无关的基础设施，不 import 业务代码 |
| `docs/` | 架构地图（本文）与[测试策略](testing.md) |
| `.agents/notes/` | 决策记录 |

## 编译面（faces）

同一份 TypeScript 按编译目标分成四个 face 配置，各自独立 typecheck，共享的严格度选项在 `tsconfig.base.json`：

- `server/tsconfig.json`：NodeNext + node types，运行于 Node。
- `apps/web/tsconfig.json`：esnext + bundler resolution + DOM lib + react-jsx，产物为浏览器 bundle。
- `packages/contracts/tsconfig.json`：NodeNext，双端共享的类型源。
- `tsconfig.tools.json`：仓库工具与门禁脚本（scripts/、vitest.config.ts）。

face 自己拥有 `module`/`moduleResolution`/`lib`；不存在根级 solution 编译。跨包类型经由 `tsconfig.base.json` 的 `paths` 从源码解析（源码平面）；引入构建产物平面（如 tsdown）时先加 face 再加构建，不合并 face。

## 门禁体系

`pnpm run check:ci` 即 `scripts/run-gates.ts ci-primary`。runner 只做聚合图调度（spawn 命令、`needs` 依赖、有界并行、fail-fast 于首个失败阶段），不解析任何工具链——加一条泳道是加 Gate 定义，不是改 runner。当前 `ci-primary` 图：lint、typecheck、test 三条并行边。

扩展点：

- **新 verify 门禁**：`scripts/verify-<invariant>.ts` + 配套 spec（证明拒绝一个非法用例），挂进 `gatesForMode`。
- **新泳道**（如 `ci-web`、`ci-python`）：`Mode` 联合加成员 + `gatesForMode` 加图；runner 本体不变。
- **UI 文案门禁**：引入 locale 字典时配套 `verify-client-ui-copy`（拒绝组件内硬编码文案）。
- **端到端（第三步）**：`ci-e2e` 聚合，独立于单测泳道；无凭据自跳过。

Git 钩子分工：pre-commit 只做暂存文件的快速检查（lint --fix、行尾空白），pre-push 只跑 typecheck，CI 拥有穷举矩阵。本地检查点保持快速是钩子存活的前提。

## 跨栈接缝（第三步预告）

`packages/contracts` 只允许两种跨栈共享物：

1. **契约 schema**——生成各端类型，禁止在任何语言里手写对端类型副本；生成物新鲜度由 gen/verify 成对门禁守护。
2. **提交在 git 里的 fixtures**——双端离线回放，保证每条泳道可独立验证。

改契约的 PR 必须在同一变更内更新 provider 与 consumer；活进程集成验证只存在于 `ci-e2e` 泳道。三阶段路线与组合规则：[Agent Note](../.agents/notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.md)。
