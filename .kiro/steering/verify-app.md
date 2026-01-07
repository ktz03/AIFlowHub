---
inclusion: manual
---

# 应用验证器 (Verify App)

当用户说 "验证应用" 或 "@verify-app" 时，执行端到端验证：

## 验证流程

### 阶段1: 后端 API 验证

```bash
# 1. 启动后端服务
pnpm run dev --filter=flowise

# 2. 等待服务就绪 (检查端口 3000)

# 3. 执行 API 健康检查
curl http://localhost:3000/api/v1/health
```

#### API 端点验证清单
| 端点 | 方法 | 预期状态 |
|------|------|----------|
| /api/v1/auth/login | POST | 200/401 |
| /api/v1/auth/register | POST | 201/400 |
| /api/v1/usage-stats | GET | 200/401 |
| /api/v1/quota | GET | 200/401 |
| /api/v1/templates | GET | 200 |
| /api/v1/chat-history | GET | 200/401 |

### 阶段2: 前端 UI 验证 (使用 Chrome DevTools)

```
1. 打开浏览器访问 http://localhost:8080
2. 检查控制台是否有 JS 错误
3. 验证页面渲染是否正常
```

#### 页面验证清单
| 页面 | URL | 检查项 |
|------|-----|--------|
| 登录页 | /login | 表单渲染、验证提示 |
| 注册页 | /register | 表单渲染、密码强度 |
| 仪表盘 | /dashboard | 数据加载、图表显示 |
| 使用统计 | /usage-stats | 图表渲染、筛选功能 |
| 配额管理 | /quota | 进度条、预警提示 |
| 模板市场 | /template-market | 模板卡片、搜索功能 |

### 阶段3: 集成验证

1. **用户注册流程**
   - 填写注册表单 → 提交 → 跳转登录页

2. **用户登录流程**
   - 填写登录表单 → 提交 → 跳转仪表盘

3. **工作流创建流程**
   - 从模板创建 → 编辑节点 → 保存 → 运行

## 输出格式

```
🔍 应用验证报告
================

后端 API: ✅ 6/6 端点正常
前端 UI:  ✅ 6/6 页面正常
集成测试: ✅ 3/3 流程正常

详细结果:
---------
[API] /api/v1/auth/login ✅ 200 OK (45ms)
[API] /api/v1/templates ✅ 200 OK (32ms)
[UI] /login ✅ 无 JS 错误
[UI] /dashboard ✅ 数据加载成功
[集成] 用户注册流程 ✅ 通过

总结: 应用验证通过 ✅
```

## 失败处理

如果验证失败：
1. 截图保存失败页面
2. 记录错误日志
3. 提供修复建议
4. 询问是否需要调试
