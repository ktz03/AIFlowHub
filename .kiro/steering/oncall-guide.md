---
inclusion: manual
---

# 值班指南 (Oncall Guide)

当用户说 "排查问题" 或 "@oncall-guide" 时，执行故障排查：

## 常见问题排查

### 1. 服务无法启动

**症状**: `pnpm run dev` 失败

**排查步骤**:
```bash
# 1. 检查 Node 版本
node -v  # 需要 >= 18.x

# 2. 清理缓存重装依赖
rm -rf node_modules
rm -rf packages/*/node_modules
pnpm install

# 3. 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# 4. 检查环境变量
cat .env
```

### 2. 数据库连接失败

**症状**: `SQLITE_ERROR` 或连接超时

**排查步骤**:
```bash
# 1. 检查数据库文件
ls -la packages/server/*.db

# 2. 重新运行迁移
pnpm run migration:run

# 3. 重置数据库 (开发环境)
rm packages/server/*.db
pnpm run migration:run
```

### 3. API 返回 401

**症状**: 所有 API 返回 Unauthorized

**排查步骤**:
1. 检查 JWT_SECRET 环境变量
2. 验证 Token 是否过期
3. 检查 Authorization header 格式

### 4. 前端页面空白

**症状**: 页面加载但无内容

**排查步骤**:
1. 打开 Chrome DevTools → Console
2. 检查网络请求是否失败
3. 检查 API 地址配置

### 5. 构建失败

**症状**: TypeScript 编译错误

**排查步骤**:
```bash
# 1. 清理构建缓存
rm -rf packages/*/dist
rm -rf .turbo

# 2. 重新构建
pnpm run build

# 3. 检查类型定义
pnpm run typecheck
```

## 日志查看

```bash
# 后端日志
tail -f packages/server/logs/app.log

# 前端构建日志
pnpm run dev --filter=flowise-ui 2>&1 | tee frontend.log
```

## 紧急回滚

```bash
# 回滚到上一个稳定版本
git checkout develop
git reset --hard HEAD~1
pnpm install
pnpm run build
```

## 联系方式

- 项目仓库: https://github.com/ktz03/AIFlowHub
- 问题反馈: 创建 GitHub Issue
