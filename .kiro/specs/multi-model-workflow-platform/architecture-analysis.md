# 项目架构分析报告

> 基于方案三（Git分支隔离）的开发规划

---

## 一、项目现状总览

### 1.1 完成度评估

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 用户认证系统 | 95% | ✅ 基本完成 |
| 国产模型适配 | 90% | ✅ 7个模型已适配 |
| 使用量统计 | 85% | ✅ 核心功能完成 |
| 配额管理 | 80% | ✅ 基本功能完成 |
| 模板市场 | 75% | ⚠️ 缺少官方模板 |
| 模型评测 | 80% | ✅ 核心功能完成 |
| 对话历史 | 85% | ✅ 核心功能完成 |
| 界面中文化 | 70% | ⚠️ 部分翻译缺失 |
| 测试覆盖 | 10% | ❌ 严重不足 |

**整体完成度：约 85%**

---

## 二、代码架构分析

### 2.1 Monorepo 结构

```
Flowise/
├── packages/
│   ├── components/     # 节点组件库（模型适配层）
│   │   ├── nodes/      # 各类节点实现
│   │   │   ├── chatmodels/   # 聊天模型节点 ⭐ 国产模型在此
│   │   │   ├── tools/        # 工具节点（即梦AI在此）
│   │   │   └── ...
│   │   ├── credentials/      # 凭证定义
│   │   └── src/              # 公共工具类
│   │
│   ├── server/         # 后端服务
│   │   ├── src/
│   │   │   ├── routes/       # API路由
│   │   │   ├── controllers/  # 控制器
│   │   │   ├── services/     # 业务逻辑
│   │   │   ├── database/     # 数据库实体和迁移
│   │   │   ├── middlewares/  # 中间件（认证、配额）
│   │   │   └── utils/        # 工具函数
│   │   └── ...
│   │
│   ├── ui/             # 前端应用
│   │   ├── src/
│   │   │   ├── views/        # 页面组件
│   │   │   ├── api/          # API调用封装
│   │   │   ├── layout/       # 布局组件
│   │   │   └── ...
│   │   └── public/locales/   # 国际化文件
│   │
│   └── api-documentation/    # API文档
```

### 2.2 已适配的国产模型

| 模型 | 目录 | 凭证类型 | 状态 |
|------|------|---------|------|
| 通义千问 | `ChatAlibabaTongyi/` | `alibabaApi` | ✅ 内置 |
| 文心一言 | `ChatBaiduWenxin/` | `baiduApi` | ✅ 内置 |
| 智谱GLM | `ChatZhipuAI/` | `zhipuApi` | ✅ 新增 |
| 讯飞星火 | `ChatSpark/` | `sparkApi` | ✅ 新增 |
| 月之暗面 | `ChatMoonshot/` | `moonshotApi` | ✅ 新增 |
| DeepSeek | `Deepseek/` | `deepseekApi` | ✅ 内置 |
| 腾讯混元 | `ChatHunyuan/` | `hunyuanApi` | ✅ 新增 |
| Ollama | `ChatOllama/` | - | ✅ 内置 |

### 2.3 新增的后端模块

| 模块 | 路由 | 控制器 | 服务 | 功能 |
|------|------|--------|------|------|
| 认证 | `auth/` | ✅ | ✅ | 登录/注册/JWT |
| 使用统计 | `usage-stats/` | ✅ | ✅ | Token消耗统计 |
| 配额管理 | `quota/` | ✅ | ✅ | 用户配额控制 |
| 模板市场 | `template-market/` | ✅ | ✅ | 模板CRUD |
| 模型评测 | `model-evaluation/` | ✅ | ✅ | 多模型对比 |
| 对话历史 | `chat-history/` | ✅ | ✅ | 历史管理 |

### 2.4 数据库实体

| 实体 | 文件 | 用途 | 状态 |
|------|------|------|------|
| User | `User.ts` | 用户信息 | ✅ 新增 |
| UsageLog | `UsageLog.ts` | 使用记录 | ✅ 新增 |
| CustomTemplate | `CustomTemplate.ts` | 工作流模板 | ✅ 扩展 |
| TemplateFavorite | `TemplateFavorite.ts` | 模板收藏 | ✅ 新增 |
| TemplateRating | `TemplateRating.ts` | 模板评分 | ✅ 新增 |
| ModelEvaluation | `ModelEvaluation.ts` | 评测记录 | ✅ 新增 |
| ChatMessage | `ChatMessage.ts` | 对话消息 | ✅ 扩展 |

---

## 三、Git分支隔离开发方案

### 3.1 分支策略

```
main (稳定版本)
  │
  ├── develop (开发主线)
  │     │
  │     ├── feature/backend-api (后端功能分支)
  │     │     ├── 凭证测试连接API
  │     │     ├── 错误处理优化
  │     │     ├── 分享功能API
  │     │     └── ...
  │     │
  │     ├── feature/frontend-ui (前端功能分支)
  │     │     ├── 新手引导系统
  │     │     ├── 凭证配置优化UI
  │     │     ├── 模板分享弹窗
  │     │     └── ...
  │     │
  │     ├── feature/templates (官方模板分支)
  │     │     ├── AI文案助手模板
  │     │     ├── 智能客服模板
  │     │     └── 营销海报模板
  │     │
  │     └── feature/i18n (国际化完善分支)
  │           └── 节点名称/描述翻译
  │
  └── hotfix/* (紧急修复分支)
```

### 3.2 并行开发任务分配

#### 窗口1：后端API开发 (`feature/backend-api`)

```bash
git checkout -b feature/backend-api develop
```

**任务清单**：

| 优先级 | 任务 | 文件位置 | 工作量 |
|-------|------|---------|-------|
| P0 | 凭证测试连接API | `routes/credentials/`, `services/credentials/` | 1.5天 |
| P0 | 错误码映射与友好化 | `middlewares/errors/`, `utils/` | 1天 |
| P1 | 模板分享API | `routes/template-market/`, `services/template-market/` | 1.5天 |
| P1 | 敏感信息脱敏服务 | `services/template-market/sanitizer.ts` | 1天 |
| P2 | 新手引导状态API | `routes/auth/`, `services/auth/` | 0.5天 |
| P2 | 数据埋点API | `routes/analytics/`, `services/analytics/` | 1天 |

**关键代码变更**：

```typescript
// 1. 新增凭证测试接口
// packages/server/src/routes/credentials/index.ts
router.post('/test', credentialsController.testConnection)

// 2. 新增分享相关接口
// packages/server/src/routes/template-market/index.ts
router.post('/:id/share', templateMarketController.shareTemplate)
router.get('/share/:shareCode', templateMarketController.getSharedTemplate)
router.post('/share/:shareCode/clone', templateMarketController.cloneSharedTemplate)
```

#### 窗口2：前端UI开发 (`feature/frontend-ui`)

```bash
git checkout -b feature/frontend-ui develop
```

**任务清单**：

| 优先级 | 任务 | 文件位置 | 工作量 |
|-------|------|---------|-------|
| P0 | 凭证配置优化（测试连接+帮助链接） | `views/credentials/` | 1天 |
| P0 | 错误提示组件优化 | `ui-component/error/` | 0.5天 |
| P1 | 新手引导系统 | `ui-component/onboarding/` | 2天 |
| P1 | 模板分享弹窗 | `views/template-market/ShareDialog.jsx` | 1天 |
| P2 | 模板预览页优化 | `views/template-market/` | 1天 |
| P2 | 创作者徽章显示 | `ui-component/badge/` | 0.5天 |

**关键代码变更**：

```jsx
// 1. 凭证配置弹窗增强
// packages/ui/src/views/credentials/AddEditCredentialDialog.jsx
<Box sx={{ display: 'flex', gap: 1 }}>
  <TextField label="API Key" ... />
  <Button onClick={handleTestConnection}>测试连接</Button>
</Box>
<Link href={getCredentialDocUrl(type)} target="_blank">
  如何获取API Key？
</Link>

// 2. 新手引导组件
// packages/ui/src/ui-component/onboarding/OnboardingTour.jsx
import Joyride from 'react-joyride'
// ... 5步引导流程
```

#### 窗口3：官方模板开发 (`feature/templates`)

```bash
git checkout -b feature/templates develop
```

**任务清单**：

| 模板名称 | 节点组合 | 场景 | 文件 |
|---------|---------|------|------|
| AI文案助手 | TextInput → ChatDeepSeek → Output | 小红书文案 | `templates/ai-copywriter.json` |
| 智能客服问答 | TextInput → ChatZhipuAI → Output | FAQ回答 | `templates/smart-customer-service.json` |
| 营销海报生成 | TextInput → ChatDeepSeek → JimengImageGen → Output | 图文创作 | `templates/marketing-poster.json` |

**模板JSON结构**：

```json
{
  "name": "AI文案助手",
  "description": "输入产品关键词，一键生成小红书风格文案",
  "category": "内容生成",
  "tags": ["文案", "小红书", "DeepSeek"],
  "isBuiltin": true,
  "isOfficial": true,
  "flowData": { "nodes": [...], "edges": [...] },
  "requiredCredentials": ["deepseekApi"],
  "estimatedTime": "3分钟",
  "difficulty": "beginner"
}
```

---

## 四、模块依赖关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (packages/ui)                       │
├─────────────────────────────────────────────────────────────────┤
│  views/                                                         │
│  ├── auth/           ← 依赖 → api/auth.js                       │
│  ├── credentials/    ← 依赖 → api/credentials.js                │
│  ├── template-market/← 依赖 → api/templateMarket.js             │
│  ├── usage-stats/    ← 依赖 → api/usageStats.js                 │
│  ├── quota/          ← 依赖 → api/quota.js                      │
│  ├── model-evaluation/← 依赖 → api/modelEvaluation.js           │
│  └── chat-history/   ← 依赖 → api/chatHistory.js                │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端 (packages/server)                     │
├─────────────────────────────────────────────────────────────────┤
│  routes/ → controllers/ → services/ → database/entities/        │
│                                                                 │
│  中间件链：                                                      │
│  request → auth.middleware → quota.middleware → controller      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     组件库 (packages/components)                 │
├─────────────────────────────────────────────────────────────────┤
│  nodes/chatmodels/                                              │
│  ├── ChatZhipuAI/    → 调用智谱API                              │
│  ├── ChatSpark/      → 调用讯飞API (WebSocket)                  │
│  ├── ChatMoonshot/   → 调用月之暗面API                          │
│  ├── ChatHunyuan/    → 调用腾讯混元API                          │
│  └── ...                                                        │
│                                                                 │
│  nodes/tools/                                                   │
│  └── JimengImageGen/ → 调用即梦AI图像生成                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、待完成任务优先级排序

### 5.1 P0 - 必须完成（发布前）

| 任务 | 模块 | 分支 | 工作量 | 影响 |
|------|------|------|-------|------|
| 凭证测试连接功能 | 后端+前端 | backend-api + frontend-ui | 2.5天 | 配置成功率 +40% |
| 凭证帮助链接 | 前端 | frontend-ui | 0.5天 | 降低配置困惑 |
| 错误信息友好化 | 后端+前端 | backend-api + frontend-ui | 2天 | 用户体验提升 |
| 3个官方模板 | 模板 | templates | 1天 | 降低冷启动门槛 |

### 5.2 P1 - 重要（Beta前）

| 任务 | 模块 | 分支 | 工作量 | 影响 |
|------|------|------|-------|------|
| 新手引导系统 | 前端 | frontend-ui | 2.5天 | 首次成功率 +20% |
| 模板分享功能 | 后端+前端 | backend-api + frontend-ui | 3天 | 增长循环启动 |
| 数据埋点部署 | 后端+前端 | backend-api + frontend-ui | 1天 | 验证假设 |

### 5.3 P2 - 可选（正式发布后）

| 任务 | 模块 | 分支 | 工作量 | 影响 |
|------|------|------|-------|------|
| 创作者徽章系统 | 后端+前端 | backend-api + frontend-ui | 1天 | 长期激励 |
| 模型适配层重构 | 组件库 | refactor/model-adapter | 3天 | 技术债偿还 |
| 单元测试补充 | 全部 | test/unit-tests | 3天 | 代码质量 |

---

## 六、开发环境配置

### 6.1 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 访问
# 前端: http://localhost:8080
# 后端: http://localhost:3000
```

### 6.2 分支开发流程

```bash
# 后端开发者
git checkout -b feature/backend-api develop
# 开发完成后
git push origin feature/backend-api
# 创建PR合并到develop

# 前端开发者
git checkout -b feature/frontend-ui develop
# 开发完成后
git push origin feature/frontend-ui
# 创建PR合并到develop

# 最终合并
git checkout develop
git merge feature/backend-api
git merge feature/frontend-ui
```

### 6.3 数据库迁移

```bash
# 新增迁移文件命名规范
# packages/server/src/database/migrations/sqlite/
# {timestamp}-{描述}.ts
# 例如: 1736000000000-AddShareFields.ts
```

---

## 七、风险与注意事项

### 7.1 分支冲突热点

| 文件 | 冲突风险 | 原因 | 建议 |
|------|---------|------|------|
| `routes/index.ts` | 高 | 多人添加路由 | 按模块分文件 |
| `database/entities/index.ts` | 高 | 多人添加实体 | 及时同步 |
| `ui/src/menu-items/` | 中 | 菜单配置 | 协调修改 |
| `locales/zh.json` | 中 | 翻译文件 | 按模块分区 |

### 7.2 API兼容性

- 新增API不影响现有功能
- 修改现有API需要版本控制
- 数据库迁移需要向后兼容

### 7.3 测试要点

| 场景 | 测试内容 |
|------|---------|
| 凭证配置 | 各模型API Key测试连接 |
| 模板分享 | 敏感信息脱敏验证 |
| 新手引导 | 不同屏幕尺寸适配 |
| 错误处理 | 各种错误码的友好提示 |

---

## 八、4周行动计划

### Week 1：基础设施

| 日期 | 后端任务 | 前端任务 |
|------|---------|---------|
| Day 1-2 | 凭证测试连接API | 凭证配置UI优化 |
| Day 3 | 错误码映射表 | 帮助链接集成 |
| Day 4-5 | 错误处理中间件 | 错误提示组件 |

### Week 2：核心功能

| 日期 | 后端任务 | 前端任务 |
|------|---------|---------|
| Day 1-2 | 模板分享API | 新手引导系统 |
| Day 3 | 敏感信息脱敏 | 分享弹窗UI |
| Day 4-5 | 官方模板数据 | 模板发现页优化 |

### Week 3：种子用户试验

| 日期 | 任务 |
|------|------|
| Day 1-2 | 埋点部署 + 数据看板 |
| Day 3-5 | 种子用户招募 + 观察记录 |

### Week 4：数据复盘

| 日期 | 任务 |
|------|------|
| Day 1-2 | 数据分析 + 漏斗分析 |
| Day 3 | 用户访谈 |
| Day 4-5 | 复盘报告 + 迭代计划 |

---

## 九、成功指标

| 指标 | 当前基线 | 目标值 | 验收时间 |
|------|---------|-------|---------|
| 凭证配置成功率 | 30% | ≥ 70% | Week 1 |
| 新用户首次成功率 | 20% | ≥ 50% | Week 2 |
| 官方模板周使用量 | 0 | ≥ 50次 | Week 3 |
| 7日留存率 | 10% | ≥ 20% | Week 4 |

---

*文档生成时间：2026-01-07*
*下次更新：开发启动后每周更新*
