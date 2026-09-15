# 测试策略

证据匹配变更面：跑能证明本次变更回归的最窄检查，不默认全量，不重复已通过的检查；CI 拥有穷举矩阵。

## 变更面 → 证据

| 变更面 | 证据 |
|---|---|
| `server/src/**` | 根 vitest 的 `node` project（`server/tests/`），Fastify `inject()` 无网络测试 |
| `apps/web/src/**` | 根 vitest 的 `web` project（jsdom + Testing Library） |
| `packages/contracts/src/**` | 消费它的双端测试 + `pnpm run typecheck` |
| `scripts/**` | `scripts/run-gates.spec.ts` + `pnpm run check:ci` |
| 文档 | 人工评审；出现死链或漂移症状后再引入 doc 门禁 |

## 聚焦运行

```sh
pnpm exec vitest run server/tests/app.spec.ts
pnpm exec vitest run --project web
```

## 演进顺序

覆盖率门禁暂未启用；引入顺序是先全局阈值，再按风险面 per-file 收紧。快照泳道与真实 e2e 泳道（`ci-e2e`）在第三步引入，无凭据自跳过；在此之前，用户可见输出由 `web` project 的组件测试守护。测试描述行为而非实现：重构不改测试，行为变更连同测试一起改。
