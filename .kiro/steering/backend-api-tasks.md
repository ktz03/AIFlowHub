---
inclusion: manual
---

# 后端 API 开发任务 (feature/backend-api)

当用户说 "开始后端任务" 或 "#backend-api-tasks" 时，按以下规划执行：

## 当前分支
确认当前在 `feature/backend-api` 分支：
```bash
git branch --show-current
```

## 第一阶段任务 (Day 1-2) - 核心路由注册

### 任务 1.1: 注册新增 API 路由到 index.ts
- 文件: `packages/server/src/index.ts`
- 添加路由: auth, usage-stats, quota, template-market, model-evaluation, chat-history

### 任务 1.2: 运行数据库迁移
```bash
pnpm run migration:run
```

### 任务 1.3: 完善认证中间件
- 文件: `packages/server/src/middlewares/auth.middleware.ts`
- 确保 JWT 验证正常工作

### 第一阶段验证
完成后执行验证脚本，确保所有路由返回非 404 响应。

---

## 第二阶段任务 (Day 3-4) - API 完善

### 任务 2.1: 完善用户认证服务
- 文件: `packages/server/src/services/auth/index.ts`
- 添加: 密码加密、Token 刷新、登出逻辑

### 任务 2.2: 完善配额管理 API
- 文件: `packages/server/src/services/quota/index.ts`

### 任务 2.3: 完善使用统计 API
- 文件: `packages/server/src/services/usage-stats/index.ts`

---

## 参考文档
- 完整规划: `.kiro/specs/multi-model-workflow-platform/parallel-dev-guide.md`
- 架构分析: `.kiro/specs/multi-model-workflow-platform/architecture-analysis.md`
