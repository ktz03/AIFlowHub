---
inclusion: always
---

# AIFlowHub 项目上下文

> 此文件会自动加载到所有 Kiro 会话中，确保 AI 了解项目规划。

## 📁 项目规划文档位置

在开始任何开发任务前，请先阅读以下文档：

| 文档 | 路径 | 用途 |
|------|------|------|
| 并行开发指南 | `.kiro/specs/multi-model-workflow-platform/parallel-dev-guide.md` | 任务清单、验证方案 |
| 架构分析 | `.kiro/specs/multi-model-workflow-platform/architecture-analysis.md` | 项目结构、模块依赖 |
| 需求文档 | `.kiro/specs/multi-model-workflow-platform/requirements.md` | 功能需求 |
| 设计文档 | `.kiro/specs/multi-model-workflow-platform/design.md` | 技术设计 |

## 🔀 分支任务对应

| 分支 | 任务文件 | 第一条命令 |
|------|----------|------------|
| `feature/backend-api` | `#backend-api-tasks` | 后端 API 开发 |
| `feature/frontend-ui` | `#frontend-ui-tasks` | 前端 UI 开发 |
| `feature/templates` | `#templates-tasks` | 模板市场开发 |

## 🚀 快速开始

当用户说 "开始开发" 或 "继续任务" 时：

1. 先检查当前分支: `git branch --show-current`
2. 根据分支读取对应的任务文件
3. 阅读 `parallel-dev-guide.md` 中对应窗口的任务清单
4. 按阶段执行任务，每阶段完成后执行验证

## 📋 验证工具

- `#build-validator` - 构建验证
- `#verify-app` - 端到端验证
- `#code-architect` - 架构分析

## 🔗 远程仓库

- 仓库: https://github.com/ktz03/AIFlowHub
- 远程名: `private`
- 推送命令: `git push private <branch> --no-verify`
