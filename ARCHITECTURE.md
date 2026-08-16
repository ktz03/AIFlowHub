# AIFlowHub 项目架构文档

## 项目概述

AIFlowHub 是一个支持多源异构大模型的可视化 AI 工作流构建平台，基于 Flowise 开源项目进行深度定制开发。

## 技术栈

### 前端

-   **框架**: React 18
-   **UI 库**: Material-UI (MUI) v5
-   **状态管理**: Redux
-   **构建工具**: Vite
-   **可视化**: ReactFlow (工作流画布)
-   **国际化**: i18next

### 后端

-   **运行时**: Node.js
-   **框架**: Express.js
-   **数据库**: SQLite (TypeORM)
-   **认证**: JWT
-   **API 文档**: OpenAPI/Swagger

### AI 集成

-   **LangChain**: 核心 AI 编排框架
-   **LlamaIndex**: 文档索引和检索
-   **国产大模型支持**:
    -   讯飞星火 (ChatSpark)
    -   腾讯混元 (ChatHunyuan)
    -   月之暗面 (ChatMoonshot)
    -   智谱 AI (ChatZhipuAI)
    -   DeepSeek

## 项目结构

```
AIFlowHub/
├── Flowise/                          # 主项目目录
│   ├── packages/
│   │   ├── server/                   # 后端服务
│   │   │   ├── src/
│   │   │   │   ├── controllers/     # 控制器层
│   │   │   │   ├── services/        # 业务逻辑层
│   │   │   │   ├── routes/          # 路由定义
│   │   │   │   ├── database/        # 数据库实体和迁移
│   │   │   │   ├── middlewares/     # 中间件
│   │   │   │   ├── utils/           # 工具函数
│   │   │   │   └── templates/       # 工作流模板
│   │   │   └── bin/                 # 启动脚本
│   │   │
│   │   ├── ui/                       # 前端应用
│   │   │   ├── src/
│   │   │   │   ├── views/           # 页面组件
│   │   │   │   ├── ui-component/    # UI组件
│   │   │   │   ├── layout/          # 布局组件
│   │   │   │   ├── store/           # Redux状态管理
│   │   │   │   ├── api/             # API调用
│   │   │   │   ├── menu-items/      # 菜单配置
│   │   │   │   └── assets/          # 静态资源
│   │   │   └── public/              # 公共资源
│   │   │
│   │   ├── components/               # AI组件库
│   │   │   ├── nodes/               # 节点定义
│   │   │   │   ├── chatmodels/      # 聊天模型
│   │   │   │   ├── tools/           # 工具节点
│   │   │   │   ├── agents/          # 智能体
│   │   │   │   └── ...
│   │   │   ├── credentials/         # 凭证定义
│   │   │   └── src/                 # 组件源码
│   │   │
│   │   └── api-documentation/        # API文档
│   │
│   ├── docker/                       # Docker配置
│   ├── docs/                         # 项目文档
│   ├── .github/                      # GitHub配置
│   ├── README.md                     # 项目说明
│   ├── DEPLOYMENT.md                 # 部署指南
│   └── package.json                  # 项目配置
│
├── .kiro/                            # Kiro IDE配置
│   ├── specs/                        # 功能规格文档
│   ├── steering/                     # AI助手指导文档
│   └── settings/                     # 设置
│
├── jimeng-api-docs.md                # 即梦API文档
└── SETUP.md                          # 环境搭建指南
```

## 核心功能模块

### 1. 用户认证与授权

-   **位置**: `packages/server/src/services/auth/`
-   **功能**: JWT 认证、用户注册登录、权限管理
-   **数据库**: User 实体

### 2. 工作流管理 (Chatflows)

-   **位置**: `packages/server/src/services/chatflows/`
-   **功能**: 工作流 CRUD、执行、版本管理
-   **前端**: `packages/ui/src/views/canvas/`

### 3. 智能体流程 (Agentflows)

-   **位置**: `packages/server/src/services/agentflows/`
-   **功能**: 多智能体协作、任务编排
-   **前端**: `packages/ui/src/views/agentflows/`

### 4. 模板市场

-   **位置**: `packages/server/src/services/template-market/`
-   **功能**: 模板浏览、导入、导出、分享
-   **前端**: `packages/ui/src/views/template-market/`

### 5. 工作流生成器

-   **位置**: `packages/server/src/services/workflow-generator/`
-   **功能**: 基于自然语言生成工作流
-   **组件**:
    -   `intent-analyzer.ts`: 意图分析
    -   `template-matcher.ts`: 模板匹配
    -   `workflow-engine.ts`: 工作流引擎
    -   `layout-engine.ts`: 布局引擎

### 6. 文档存储 (Document Store)

-   **位置**: `packages/server/src/services/document-store/`
-   **功能**: 文档上传、向量化、检索
-   **前端**: `packages/ui/src/views/docstore/`

### 7. 对话历史

-   **位置**: `packages/server/src/services/chat-history/`
-   **功能**: 对话记录、历史查询、继续对话
-   **前端**: `packages/ui/src/views/chat-history/`

### 8. 配额管理

-   **位置**: `packages/server/src/services/quota/`
-   **功能**: Token 配额、使用统计、预警
-   **前端**: `packages/ui/src/views/quota/`

### 9. 使用统计

-   **位置**: `packages/server/src/services/usage-stats/`
-   **功能**: 使用量统计、成本分析
-   **前端**: `packages/ui/src/views/usage-stats/`

### 10. 模型评估

-   **位置**: `packages/server/src/services/model-evaluation/`
-   **功能**: 模型性能评估、对比分析
-   **前端**: `packages/ui/src/views/model-evaluation/`

### 11. 系统配置

-   **位置**: `packages/server/src/services/system-config/`
-   **功能**: 系统级配置管理
-   **前端**: `packages/ui/src/views/system-config/`

### 12. 用户管理 (管理员)

-   **位置**: `packages/server/src/services/users/`
-   **功能**: 用户管理、角色分配
-   **前端**: `packages/ui/src/views/admin/UserManagement.jsx`

## 数据库设计

### 核心实体

1. **User** - 用户表
2. **ChatFlow** - 工作流表
3. **ChatMessage** - 对话消息表
4. **Credential** - 凭证表
5. **Tool** - 工具表
6. **Assistant** - 助手表
7. **DocumentStore** - 文档存储表
8. **CustomTemplate** - 自定义模板表
9. **UsageLog** - 使用日志表
10. **SystemConfig** - 系统配置表

### 数据库迁移

-   **位置**: `packages/server/src/database/migrations/sqlite/`
-   **工具**: TypeORM Migration

## API 架构

### RESTful API 设计

```
/api/v1/
├── auth/                    # 认证相关
│   ├── POST /login
│   ├── POST /register
│   └── GET /me
│
├── chatflows/               # 工作流
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
│
├── agentflows/              # 智能体流程
├── template-market/         # 模板市场
├── workflow-generator/      # 工作流生成
├── chat-history/            # 对话历史
├── document-stores/         # 文档存储
├── credentials/             # 凭证管理
├── tools/                   # 工具管理
├── variables/               # 变量管理
├── apikey/                  # API密钥
├── quota/                   # 配额管理
├── usage-stats/             # 使用统计
├── model-evaluation/        # 模型评估
├── system-config/           # 系统配置
└── admin/                   # 管理员接口
    └── users/
```

## 部署架构

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问地址
http://localhost:8080
```

### 生产环境

#### Docker 部署

```bash
# 构建镜像
docker build -t aiflow-hub .

# 运行容器
docker run -p 8080:3000 aiflow-hub
```

#### Docker Compose

```bash
docker-compose up -d
```

## 安全机制

1. **JWT 认证**: 基于 Token 的无状态认证
2. **密码加密**: bcrypt 加密存储
3. **API 密钥**: 支持 API Key 认证
4. **权限控制**: 基于角色的访问控制(RBAC)
5. **配额限制**: Token 使用量限制

## 性能优化

1. **缓存机制**: Redis 缓存(可选)
2. **数据库索引**: 关键字段索引优化
3. **懒加载**: 前端组件按需加载
4. **代码分割**: Vite 自动代码分割
5. **静态资源 CDN**: 生产环境建议使用 CDN

## 监控与日志

1. **使用日志**: UsageLog 表记录所有 API 调用
2. **错误日志**: Winston 日志框架
3. **性能监控**: 响应时间统计
4. **配额预警**: 自动预警机制

## 扩展性设计

### 添加新的 AI 模型

1. 在 `packages/components/nodes/chatmodels/` 创建新模型节点
2. 在 `packages/components/credentials/` 创建对应凭证
3. 注册到组件加载器

### 添加新的工具

1. 在 `packages/components/nodes/tools/` 创建工具节点
2. 实现工具接口
3. 添加到工具列表

### 添加新的功能模块

1. 后端: 创建 controller、service、route
2. 前端: 创建 view、api 调用
3. 数据库: 创建实体和迁移
4. 菜单: 更新 `menu-items/dashboard.js`

## 国际化

-   **支持语言**: 中文(zh)、英文(en)
-   **配置文件**: `packages/ui/public/locales/`
-   **使用**: i18next 框架

## 品牌定制

-   **项目名称**: AIFlowHub
-   **Logo**: `packages/ui/src/assets/images/aiflow_logo.png`
-   **Favicon**: `packages/ui/public/favicon.jpg`
-   **主题色**: 深色主题为主

## 开发规范

1. **代码风格**: ESLint + Prettier
2. **提交规范**: Conventional Commits
3. **分支策略**: Git Flow
4. **测试**: Jest + React Testing Library

## 技术债务与改进方向

1. 添加单元测试覆盖
2. 实现 Redis 缓存层
3. 优化数据库查询性能
4. 完善 API 文档
5. 添加 E2E 测试

## 联系方式

-   **开发者**: 李林钊
-   **学校**: 广西大学

---

最后更新: 2026-08-16
