# AGENTS.md

adlc-kit-ts —— adlc-kit 系列的 TypeScript 参考实现：React + Vite 前端、Fastify 后端、pnpm workspaces、以 `scripts/run-gates.ts` 为唯一编排点的门禁体系。改代码前先读 [docs/architecture.md](docs/architecture.md)。

## 命令

```sh
pnpm install          # 安装依赖，postinstall 自动安装 lefthook 钩子
pnpm run check:ci     # 门禁聚合：lint + typecheck + test（本地与 CI 同一入口）
pnpm run dev:server   # Fastify，http://127.0.0.1:3000/health
pnpm run dev:web      # Vite dev server（/api 代理到 127.0.0.1:3000）
```

`typecheck` / `lint` / `test` 可单独运行。测试证据按变更面选择（[docs/testing.md](docs/testing.md)），不默认全量。

## 核心约定

- **ESM everywhere**（`"type": "module"`）。跨包用包名 `@adlc-kit/*`，包内相对导入带 `.ts` 后缀；运行时经 tsx 直接执行 TS，构建步骤引入前不存在 `lib/`。
- **显式优先于隐式**：默认值是拥有者的显式 resolve 步骤，不藏在 `run()` 里；配置错误在加载期响亮失败，从不静默跳过缺失引用。
- **类型化同进程边界信任 TypeScript**：不为静态接口已要求的值补运行时校验或敌意输入测试；验证只发生在 wire、文件、环境、子进程边界。
- **可机械判定的约束硬化为门禁**：写成 `scripts/verify-*.ts` 并配一个拒绝非法用例的 spec，再挂进 `run-gates.ts` 聚合图。软约定被违反两次即启动硬化。
- **测试描述行为**。模型/用户可见输出的快照泳道与真实 e2e 泳道在第三步引入，无凭据自跳过。
- **UI 文案单一家园**：现阶段页面文案只出现在 `apps/web/src` 组件内；引入多语言时迁移到 locale 字典并配套 verify 门禁（见 architecture.md 扩展点）。
- **文档随代码同 PR 更新**；每个事实只有一个家，其余位置链接。文档写当前状态与完整契约，不写推理过程与变更史。
- **每个非平凡变更在同一 PR 内新增或更新一条 Agent Note**（[.agents/notes/README.md](.agents/notes/README.md)）；纯机械或局部修改豁免。
- **密钥永不入库**：真实凭据走环境变量或未提交的 `.env`；涉及凭据的测试无凭据时自跳过。
- **跨栈接入规则**：新技术栈先建独立语言根 + 独立泳道，本栈门禁全绿后才建跨栈接缝；接缝只通过 `packages/contracts` 与提交在 git 里的 fixtures，活进程验证只存在于 e2e 泳道（[路线图决策](.agents/notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.md)）。

## Git 钩子与门禁分工

pre-commit 只做暂存文件快速检查（oxlint --fix、行尾空白检查，文件以恰好一个换行结尾）；pre-push 只跑 typecheck；CI 拥有穷举矩阵（[.github/workflows/ci.yml](.github/workflows/ci.yml)）。不绕过失败的门禁：先修复，或证明失败与环境相关。不为提交或推送重复运行已通过的检查。
