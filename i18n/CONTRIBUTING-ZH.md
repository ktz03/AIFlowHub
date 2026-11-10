# 贡献给 AIFlowHub

[English](../CONTRIBUTING.md) | 中文

感谢关注。AIFlowHub 是 [Flowise](https://github.com/FlowiseAI/Flowise) 的**社区延续仓库**：**2026-01 起即已独立维护**（早于官方 2026-07 Code Freeze / 2026-08 Archive）。公告：[Future of Flowise](https://github.com/FlowiseAI/Flowise/discussions/6727)。

原先计划贡献给 Flowise 的改动，欢迎提交到本仓库。

## 可以怎么贡献

-   通过 [Issues](https://github.com/ktz03/AIFlowHub/issues) 报告 Bug、提需求
-   改进文档（`README.md`、`docs/`、`DEPLOYMENT.md`）
-   新增 / 修复 `packages/components` 节点与凭证
-   增强 `packages/server`（workflow-generator、治理、鉴权等）
-   改进 `packages/ui`

### 适合上手的方向

-   新的 Chat Model 节点（尤其是 OpenAI-compatible 国内模型）
-   新的 Tool 节点（含 credential 与图标）
-   带复现步骤的 Bugfix
-   i18n / 文档 / Docker Offline 部署改进

## 本地开发

需要 Node.js 18+/20+，PNPM 8+。

```bash
git clone https://github.com/ktz03/AIFlowHub.git
cd AIFlowHub
pnpm install
pnpm build
pnpm dev
```

-   开发 UI：`http://localhost:8080`
-   生产启动：`pnpm start` → `http://localhost:3000`

## Pull Request 流程

1. Fork 本仓库，创建分支：
    - 功能：`feature/<short-name>`
    - 修复：`bugfix/<short-name>`
2. 尽量保持 PR 聚焦（一个主题）
3. 遵循现有 ESLint / Prettier（提交时会跑 hooks）
4. 用户可见行为变更请同步文档
5. 向 **`develop`** 开 PR，说明改动原因与测试方式

### 提交前检查

-   [ ] 本地可 `pnpm build`
-   [ ] 未提交密钥、`.env`、sqlite、docker 镜像包
-   [ ] 新节点如需凭证 / 图标已补齐

## 安全

敏感漏洞请勿公开 Issue，见 [`SECURITY.md`](../SECURITY.md)。

## 许可证

贡献内容默认按本仓库许可证授权（见 [`LICENSE.md`](../LICENSE.md)，继承 Flowise Apache-2.0 谱系）。

## 维护信息

-   仓库：https://github.com/ktz03/AIFlowHub
-   默认分支：`develop`
