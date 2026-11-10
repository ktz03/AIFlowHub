# AIFlowHub

🚀 下一代多模型 AI 应用工厂：说话即搭建，拖拽即上线，云端+本地一盘棋，内置企业级用量与评测闭环。

**Community continuation of [Flowise](https://github.com/FlowiseAI/Flowise)**（官方已于 2026-08 EOL / Archive，详见 [Future of Flowise](https://github.com/FlowiseAI/Flowise/discussions/6727)）。本仓库在 Apache-2.0 基础上继续演进：Skill-driven NL→Workflow、多源异构 LLM、Cloud+Local Hybrid Inference，以及 Quota / Cost / Eval 治理闭环。

[![GitHub stars](https://img.shields.io/github/stars/ktz03/AIFlowHub?style=social)](https://github.com/ktz03/AIFlowHub)
[![License](https://img.shields.io/github/license/ktz03/AIFlowHub)](./LICENSE.md)
[![Issues](https://img.shields.io/github/issues/ktz03/AIFlowHub)](https://github.com/ktz03/AIFlowHub/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

## 目录

-   [项目概述](#项目概述)
-   [相对 Flowise 的定位](#相对-flowise-的定位)
-   [核心能力](#核心能力)
-   [功能模块](#功能模块)
-   [与原版 Flowise 的差异](#与原版-flowise-的差异)
-   [系统架构](#系统架构)
-   [技术栈](#技术栈)
-   [快速开始](#快速开始)
-   [配置说明](#配置说明)
-   [部署方式](#部署方式)
-   [内置模板](#内置模板)
-   [安全与治理](#安全与治理)
-   [文档索引](#文档索引)
-   [贡献](#贡献)
-   [许可证与致谢](#许可证与致谢)

## 项目概述

AIFlowHub 在 Flowise 之上扩展「多模型统一接入 + 自然语言生成工作流 + 平台治理」能力，适用于：

-   云端大模型与本地/离线模型混合编排
-   拖拽式工作流快速搭建与迭代
-   自然语言到可执行工作流的自动生成（Skill-driven Intent Routing）
-   配额、成本、评测、审计等运营治理场景

当前版本基于 Flowise `2.2.7` 演进，采用 PNPM Monorepo 组织前后端与组件库。

## 相对 Flowise 的定位

| 项目                | 状态           | 说明                                                              |
| ------------------- | -------------- | ----------------------------------------------------------------- |
| FlowiseAI/Flowise   | Archived / EOL | 官方不再接受 PR                                                   |
| **ktz03/AIFlowHub** | **Active**     | 社区延续仓：接受 Issue / PR，持续合入模型节点、生成链路与治理能力 |

欢迎把原计划贡献给 Flowise 的 Chat Model / Tool / Bugfix 提交到本仓库。

## 核心能力

| 能力           | 说明                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| 可视化编排     | 基于 ReactFlow 的拖拽式工作流编辑、调试与执行                                   |
| 多源异构模型   | 统一接入 OpenAI、Anthropic、Ollama 以及星火、混元、月之暗面、智谱、通义、文心等 |
| 智能工作流生成 | 支持模板匹配、LLM 生成、多智能体协作三种生成模式                                |
| 模板市场       | 模板共享、复用、评分、收藏与分类统计                                            |
| 平台治理       | 配额控制、用量/成本统计、模型评测、会话历史管理                                 |
| 安全能力       | 登录鉴权、系统配置加密存储、接口访问控制                                        |

## 功能模块

| 模块             | 入口                | 说明                               |
| ---------------- | ------------------- | ---------------------------------- |
| Chatflows        | `/chatflows`        | 可视化工作流创建、编辑与发布       |
| Agentflows       | `/agentflows`       | 多智能体流程编排                   |
| Assistants       | `/assistants`       | 助手配置与管理                     |
| Marketplaces     | `/marketplaces`     | 官方/社区市场模板                  |
| Template Market  | `/template-market`  | 平台增强模板市场                   |
| Model Evaluation | `/model-evaluation` | 多模型并行评测与对比               |
| Document Stores  | `/document-stores`  | 文档上传、向量化与检索             |
| Chat History     | `/chat-history`     | 会话检索、导出与统计               |
| Quota            | `/quota`            | Token/调用额度与预警               |
| Usage Stats      | `/usage-stats`      | 用量趋势、成本分析与导出           |
| System Config    | `/system-config`    | 管理员系统配置（含生成器 API Key） |
| User Management  | `/admin/users`      | 用户与角色管理                     |

## 与原版 Flowise 的差异

在保留 Flowise 核心编排能力的基础上，重点扩展了以下服务：

| 扩展模块       | 路径                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| 工作流自动生成 | `packages/server/src/services/workflow-generator`                          |
| 多智能体生成器 | `packages/server/src/services/workflow-generator/multi-agent-generator.ts` |
| 模型评测中心   | `packages/server/src/services/model-evaluation`                            |
| 配额治理       | `packages/server/src/services/quota`                                       |
| 用量与成本统计 | `packages/server/src/services/usage-stats`                                 |
| 系统配置中心   | `packages/server/src/services/system-config`                               |
| 对话历史管理   | `packages/server/src/services/chat-history`                                |
| 模板市场增强   | `packages/server/src/services/template-market`                             |

### 生成链路关键策略

-   意图分析、规则匹配评分与冲突惩罚
-   置信度归一化与低置信度回退
-   多因素模板相似度匹配与参数定制
-   拓扑排序驱动的分层自动布局与重叠消解
-   参数兼容回退、异步轮询与超时控制
-   敏感配置 AES-256-CBC 加密存储

## 系统架构

```text
Flowise/
├── packages/
│   ├── server/                 # 后端 API、业务服务、数据库与模板
│   ├── ui/                     # 前端应用与可视化交互
│   ├── components/             # 节点、模型与工具组件
│   └── api-documentation/      # OpenAPI 文档
├── docs/                       # 功能设计文档
├── docker/                     # 容器化与离线部署方案
├── ARCHITECTURE.md             # 架构说明
├── DEPLOYMENT.md               # 部署手册
└── SECURITY.md                 # 安全说明
```

```text
用户 / 管理员
    │
    ▼
packages/ui  (React + ReactFlow)
    │  HTTP / SSE
    ▼
packages/server  (Express + TypeORM)
    ├── workflow-generator / template-market
    ├── quota / usage-stats / model-evaluation
    ├── system-config / chat-history
    └── chatflows / agentflows / document-store
    │
    ├── SQLite / PostgreSQL
    └── packages/components  (LangChain 节点与模型适配)
```

## 技术栈

-   **前端**：React 18、MUI、Redux、Vite、ReactFlow、i18next
-   **后端**：Node.js、Express、TypeORM、SQLite（可选 PostgreSQL）
-   **AI 编排**：LangChain、LlamaIndex 生态
-   **工程化**：PNPM Workspace、Turbo、Docker、Docker Compose

## 快速开始

### 1. 环境准备

-   Node.js `>= 18.15.0`（推荐 18.x / 20.x）
-   PNPM `>= 8`（仓库当前锁定为 `pnpm@10.26.2`）

```bash
npm i -g pnpm
```

### 2. 安装与构建

在 `Flowise/` 目录执行：

```bash
pnpm install
pnpm build
```

### 3. 开发模式

```bash
pnpm dev
```

-   前端开发入口：`http://localhost:8080`

### 4. 生产模式启动

```bash
pnpm start
```

-   默认访问地址：`http://localhost:3000`

常用脚本：

| 命令                       | 说明                    |
| -------------------------- | ----------------------- |
| `pnpm build`               | 构建全部包              |
| `pnpm build-force`         | 清理后强制全量构建      |
| `pnpm dev`                 | 前后端并行开发          |
| `pnpm start`               | 启动已构建服务          |
| `pnpm start-worker`        | 启动 Worker             |
| `pnpm clean` / `pnpm nuke` | 清理构建产物 / 深度清理 |

## 配置说明

可在 `packages/server/.env` 或 Docker 环境变量中配置，常见项：

```env
PORT=3000
FLOWISE_USERNAME=user
FLOWISE_PASSWORD=1234
DATABASE_TYPE=sqlite
DATABASE_PATH=./data
JWT_SECRET=please-change-me
LOG_LEVEL=info
BLOB_STORAGE_PATH=./storage
ENCRYPTION_KEY=please-change-me
```

| 变量                                    | 说明                     |
| --------------------------------------- | ------------------------ |
| `PORT`                                  | 服务端口，默认 `3000`    |
| `FLOWISE_USERNAME` / `FLOWISE_PASSWORD` | 基础登录凭证             |
| `DATABASE_TYPE`                         | `sqlite` 或 `postgres`   |
| `JWT_SECRET`                            | JWT 签名密钥             |
| `ENCRYPTION_KEY`                        | 系统配置敏感字段加密密钥 |
| `BLOB_STORAGE_PATH`                     | 文件/对象存储路径        |

完整变量与生产建议见 [`DEPLOYMENT.md`](./DEPLOYMENT.md)、[`docs/SYSTEM-CONFIG.md`](./docs/SYSTEM-CONFIG.md)。

## 部署方式

### Docker Compose（推荐）

```bash
cd docker
cp .env.example .env
docker compose up -d
```

可选编排文件：

| 文件                                | 用途                   |
| ----------------------------------- | ---------------------- |
| `docker/docker-compose.yml`         | 标准部署               |
| `docker/docker-compose.quick.yml`   | 快速体验               |
| `docker/docker-compose.offline.yml` | 离线本地模型（Ollama） |

### 离线本地模型

```bash
cd docker
docker compose -f docker-compose.offline.yml up -d
```

详细说明：[`docker/OFFLINE-LLM.zh-CN.md`](./docker/OFFLINE-LLM.zh-CN.md)

### 生产建议

-   反向代理统一入口（Nginx / Caddy），启用 HTTPS
-   持久化数据库、日志与对象存储目录
-   定期归档用量日志与评测记录
-   使用强随机 `JWT_SECRET` / `ENCRYPTION_KEY`

完整步骤见 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

## 内置模板

工作流生成器内置场景模板（`packages/server/src/templates/`）：

| 模板     | 文件                    |
| -------- | ----------------------- |
| 文档问答 | `doc-qa.json`           |
| 客服助手 | `customer-service.json` |
| 代码助手 | `code-assistant.json`   |
| 教学辅导 | `tutor.json`            |
| 创意写作 | `creative-writing.json` |
| 邮件助手 | `email-assistant.json`  |
| 内容摘要 | `content-summary.json`  |
| 数据分析 | `data-analysis.json`    |
| 翻译     | `translation.json`      |
| 图片生成 | `image-generation.json` |

## 安全与治理

-   **认证授权**：应用级登录与管理员权限控制
-   **敏感数据保护**：系统配置采用 AES-256-CBC 加密存储
-   **调用治理**：配额检查、频率预警、成本统计与审计日志
-   **可观测性**：成功率、耗时、Token、成本等指标追踪

更多说明见 [`SECURITY.md`](./SECURITY.md)。

## 文档索引

| 文档                                                                           | 说明               |
| ------------------------------------------------------------------------------ | ------------------ |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                                         | 项目架构与模块说明 |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)                                             | 部署与升级手册     |
| [`SECURITY.md`](./SECURITY.md)                                                 | 安全披露与策略     |
| [`docs/DYNAMIC-WORKFLOW-GENERATION.md`](./docs/DYNAMIC-WORKFLOW-GENERATION.md) | 动态工作流生成方案 |
| [`docs/SYSTEM-CONFIG.md`](./docs/SYSTEM-CONFIG.md)                             | 系统配置设计       |
| [`docker/README.md`](./docker/README.md)                                       | Docker 使用说明    |
| [`docker/OFFLINE-LLM.zh-CN.md`](./docker/OFFLINE-LLM.zh-CN.md)                 | 离线 LLM 部署      |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)                                         | 贡献指南           |

## 贡献

AIFlowHub 接受社区贡献。推荐优先提交：

-   新的 Chat Model / Tool 节点（尤其是 OpenAI-compatible 国内模型）
-   Workflow Generator / Skill Registry 增强
-   Bugfix、文档、测试与 Docker/Offline 部署改进

详见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。欢迎直接开 [Issue](https://github.com/ktz03/AIFlowHub/issues) / [Pull Request](https://github.com/ktz03/AIFlowHub/pulls)。

## 许可证与致谢

-   本项目为 [Flowise](https://github.com/FlowiseAI/Flowise)（Apache-2.0）的社区延续演进，保留对上游作者与全体贡献者的致谢。
-   源码许可证与第三方依赖声明以仓库内 [`LICENSE.md`](./LICENSE.md) 及相关文件为准。
-   Flowise 官方 EOL 说明：[Discussion #6727](https://github.com/FlowiseAI/Flowise/discussions/6727)。
