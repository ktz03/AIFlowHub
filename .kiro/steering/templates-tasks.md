---
inclusion: manual
---

# 模板市场开发任务 (feature/templates)

当用户说 "开始模板任务" 或 "#templates-tasks" 时，按以下规划执行：

## 当前分支
确认当前在 `feature/templates` 分支：
```bash
git branch --show-current
```

## 第一阶段任务 (Day 1-2) - 模板数据

### 任务 1.1: 创建官方模板 JSON
- 位置: `packages/server/src/templates/`
- 模板列表:
  - 客服机器人 (customer-service.json)
  - 文档问答 (doc-qa.json)
  - 代码助手 (code-assistant.json)

### 任务 1.2: 完善模板市场 API
- 文件: `packages/server/src/services/template-market/index.ts`
- 添加: 模板搜索、分类筛选

### 第一阶段验证
验证模板 JSON 格式正确，API 返回正确的模板列表。

---

## 第二阶段任务 (Day 3-4) - 模板页面

### 任务 2.1: 完善模板市场页面
- 文件: `packages/ui/src/views/template-market/index.jsx`
- 添加: 模板卡片、预览、一键部署

### 任务 2.2: 添加模板详情页
- 添加: 模板说明、使用教程、评分

---

## 参考文档
- 完整规划: `.kiro/specs/multi-model-workflow-platform/parallel-dev-guide.md`
- 架构分析: `.kiro/specs/multi-model-workflow-platform/architecture-analysis.md`
