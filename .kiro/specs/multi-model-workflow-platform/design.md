# 系统设计文档

## 项目信息

- **选题名称**：支持多源异构大模型的可视化应用构建平台研究与实现
- **基础项目**：Flowise (https://github.com/FlowiseAI/Flowise)

---

## 一、系统概述

### 1.1 系统定位

本系统是一个基于 Flowise 二次开发的多模型 AI 工作流平台，主要特点：

1. **多模型支持**：整合国内外 15+ 主流大模型
2. **可视化编排**：拖拽式工作流构建
3. **多租户架构**：支持多用户独立使用
4. **成本可控**：使用量统计和配额管理

### 1.2 目标用户

- AI 应用开发者
- 企业 AI 平台管理员
- 无编程基础的 AI 应用使用者

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 工作流    │  │ 模板     │  │ 统计     │  │ 用户     │        │
│  │ 编辑器    │  │ 市场     │  │ 面板     │  │ 管理     │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       前端应用层                                 │
│                  React + TypeScript + Material UI                │
│                       React Flow (工作流编辑)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ RESTful API / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                       后端服务层                                 │
│                    Node.js + Express + TypeORM                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 认证服务  │  │ 工作流   │  │ 模型     │  │ 统计     │        │
│  │          │  │ 引擎     │  │ 网关     │  │ 服务     │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       数据持久层                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   PostgreSQL     │              │     Redis        │        │
│  │   (主数据库)      │              │   (缓存/会话)    │        │
│  └──────────────────┘              └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      模型提供商层                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ OpenAI │ │ Claude │ │ 通义   │ │ 文心   │ │ 智谱   │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 讯飞   │ │ Kimi   │ │DeepSeek│ │ 混元   │ │ Ollama │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘
```


### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + TypeScript | 类型安全，生态丰富 |
| UI 组件 | Material UI 5.x | Flowise 原生使用 |
| 工作流编辑 | React Flow | 专业的节点编辑库 |
| 状态管理 | Redux Toolkit | Flowise 原生使用 |
| 后端框架 | Node.js + Express | Flowise 原生使用 |
| ORM | TypeORM | 支持多种数据库 |
| 数据库 | PostgreSQL / SQLite | 生产/开发环境 |
| 缓存 | Redis | 会话管理、限流 |
| 认证 | JWT | 无状态认证 |
| 部署 | Docker + Docker Compose | 容器化部署 |

---

## 三、模块设计

### 3.1 国产模型适配模块

#### 3.1.1 模型适配架构

```
┌─────────────────────────────────────────────────────────┐
│                    统一调用接口                          │
│              ChatModel.call(messages, options)          │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  QwenAdapter │ │WenxinAdapter │ │ ZhipuAdapter │
    │  通义千问     │ │  文心一言     │ │   智谱GLM    │
    └──────────────┘ └──────────────┘ └──────────────┘
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ DashScope API│ │ Wenxin API   │ │ Zhipu API    │
    └──────────────┘ └──────────────┘ └──────────────┘
```

#### 3.1.2 支持的模型列表

| 提供商 | 模型 | API 特点 |
|--------|------|---------|
| 阿里云 | qwen-turbo, qwen-plus, qwen-max | DashScope API，支持流式 |
| 百度 | ernie-bot, ernie-bot-4, ernie-bot-turbo | 需要 access_token，支持流式 |
| 智谱 | glm-4, glm-3-turbo | 类 OpenAI 格式 |
| 讯飞 | spark-v3.5, spark-v3.0 | WebSocket 协议 |
| 月之暗面 | moonshot-v1-8k, moonshot-v1-32k | 类 OpenAI 格式 |
| DeepSeek | deepseek-chat, deepseek-coder | 类 OpenAI 格式 |
| 腾讯 | hunyuan-lite, hunyuan-standard | 腾讯云 API |
| 本地 | Ollama (llama, qwen, mistral...) | 本地 REST API |

#### 3.1.3 节点实现示例

```typescript
// packages/components/nodes/chatmodels/ChatQwen/ChatQwen.ts
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'

class ChatQwen implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = '通义千问'
        this.name = 'chatQwen'
        this.version = 1.0
        this.type = 'ChatQwen'
        this.icon = 'qwen.svg'
        this.category = '聊天模型'
        this.description = '阿里云通义千问大语言模型'
        this.baseClasses = [this.type, 'BaseChatModel', ...getBaseClasses(ChatQwen)]
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                description: '阿里云 DashScope API Key'
            },
            {
                label: '模型名称',
                name: 'modelName',
                type: 'options',
                options: [
                    { label: 'qwen-turbo (快速)', name: 'qwen-turbo' },
                    { label: 'qwen-plus (均衡)', name: 'qwen-plus' },
                    { label: 'qwen-max (最强)', name: 'qwen-max' },
                    { label: 'qwen-max-longcontext (长文本)', name: 'qwen-max-longcontext' }
                ],
                default: 'qwen-turbo'
            },
            {
                label: '温度',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
                optional: true,
                description: '控制输出的随机性，0-2之间'
            },
            {
                label: '最大 Token',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                description: '生成的最大 Token 数量'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const apiKey = nodeData.inputs?.apiKey as string
        const modelName = nodeData.inputs?.modelName as string
        const temperature = nodeData.inputs?.temperature as number
        const maxTokens = nodeData.inputs?.maxTokens as number

        const model = new QwenChatModel({
            apiKey,
            modelName,
            temperature,
            maxTokens,
            streaming: true
        })

        return model
    }
}

module.exports = { nodeClass: ChatQwen }
```


### 3.2 用户管理模块

#### 3.2.1 用户系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户管理模块                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  认证服务    │  │  权限服务    │  │  配额服务    │     │
│  │             │  │             │  │             │     │
│  │ - 注册      │  │ - 角色管理   │  │ - 配额设置   │     │
│  │ - 登录      │  │ - 权限校验   │  │ - 用量统计   │     │
│  │ - Token管理 │  │ - 资源隔离   │  │ - 超额处理   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### 3.2.2 数据库设计

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',        -- admin, user
    status VARCHAR(20) DEFAULT 'active',    -- active, disabled
    quota_limit INT DEFAULT 100000,         -- Token 配额
    quota_used INT DEFAULT 0,               -- 已使用配额
    quota_reset_at TIMESTAMP,               -- 配额重置时间
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API 密钥表
CREATE TABLE api_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,          -- qwen, wenxin, zhipu...
    credential_name VARCHAR(100),           -- 用户自定义名称
    encrypted_key TEXT NOT NULL,            -- AES-256 加密的密钥
    encrypted_secret TEXT,                  -- 部分提供商需要 secret
    is_valid BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 使用记录表
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,          -- 预估成本（元）
    latency_ms INT,                         -- 响应延迟
    status VARCHAR(20),                     -- success, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 工作流表（扩展原有表）
ALTER TABLE chatflows ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE chatflows ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE chatflows ADD COLUMN use_count INT DEFAULT 0;

-- 工作流模板表
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),                   -- 分类：客服、写作、翻译...
    tags VARCHAR(255),                      -- 标签，逗号分隔
    flow_data JSONB NOT NULL,
    thumbnail_url VARCHAR(255),
    author_id UUID REFERENCES users(id),
    is_official BOOLEAN DEFAULT false,
    use_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 对话历史表
CREATE TABLE chat_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID,
    session_id VARCHAR(100),
    role VARCHAR(20) NOT NULL,              -- user, assistant, system
    content TEXT NOT NULL,
    tokens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 模型评测记录表
CREATE TABLE model_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_input TEXT NOT NULL,
    results JSONB NOT NULL,                 -- 各模型的输出结果
    created_at TIMESTAMP DEFAULT NOW()
);
```


### 3.3 统计分析模块

#### 3.3.1 统计面板设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        使用统计面板                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  今日调用    │  │  本月消耗    │  │  预估成本    │             │
│  │    156      │  │  125,000    │  │   ¥12.50    │             │
│  │    次       │  │   Tokens    │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    使用趋势图                            │   │
│  │     ▲                                                   │   │
│  │     │    ╭─╮                                           │   │
│  │     │   ╭╯ ╰╮  ╭─╮                                     │   │
│  │     │  ╭╯   ╰──╯ ╰╮                                    │   │
│  │     │──╯          ╰──                                  │   │
│  │     └────────────────────────────────────────────▶     │   │
│  │       周一  周二  周三  周四  周五  周六  周日           │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │    模型使用占比       │  │    成本分布          │           │
│  │    ┌────────┐        │  │    ┌────────┐       │           │
│  │    │ 通义   │ 45%    │  │    │ GPT-4  │ 60%   │           │
│  │    │ 文心   │ 30%    │  │    │ 通义   │ 25%   │           │
│  │    │ 智谱   │ 15%    │  │    │ 其他   │ 15%   │           │
│  │    │ 其他   │ 10%    │  │    └────────┘       │           │
│  │    └────────┘        │  │                     │           │
│  └──────────────────────┘  └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 成本计算规则

```typescript
// 各模型定价（每千 Token，单位：元）
const MODEL_PRICING = {
    // OpenAI
    'gpt-4': { input: 0.21, output: 0.42 },
    'gpt-4-turbo': { input: 0.07, output: 0.21 },
    'gpt-3.5-turbo': { input: 0.0035, output: 0.007 },
    
    // 通义千问
    'qwen-turbo': { input: 0.002, output: 0.006 },
    'qwen-plus': { input: 0.004, output: 0.012 },
    'qwen-max': { input: 0.04, output: 0.12 },
    
    // 文心一言
    'ernie-bot': { input: 0.008, output: 0.008 },
    'ernie-bot-4': { input: 0.12, output: 0.12 },
    'ernie-bot-turbo': { input: 0.004, output: 0.004 },
    
    // 智谱
    'glm-4': { input: 0.1, output: 0.1 },
    'glm-3-turbo': { input: 0.001, output: 0.001 },
    
    // DeepSeek
    'deepseek-chat': { input: 0.001, output: 0.002 },
    'deepseek-coder': { input: 0.001, output: 0.002 },
    
    // 本地模型
    'ollama-*': { input: 0, output: 0 }  // 免费
}
```

### 3.4 模型评测模块

#### 3.4.1 评测流程

```
用户输入测试问题
        │
        ▼
选择要对比的模型（2-5个）
        │
        ▼
┌───────┴───────┐
│   并行调用     │
├───────────────┤
│ Model A ──────┼──▶ 结果 A
│ Model B ──────┼──▶ 结果 B
│ Model C ──────┼──▶ 结果 C
└───────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│           评测结果展示                 │
├───────────────────────────────────────┤
│  模型    │ 响应时间 │ Token │ 成本    │
├──────────┼──────────┼───────┼─────────┤
│ 通义千问  │  1.2s   │  256  │ ¥0.002  │
│ 文心一言  │  1.8s   │  312  │ ¥0.003  │
│ 智谱GLM  │  0.9s   │  198  │ ¥0.020  │
└───────────────────────────────────────┘
```

---

## 四、接口设计

### 4.1 认证接口

```typescript
// 用户注册
POST /api/v1/auth/register
Request: { username, email, password }
Response: { success, message, user }

// 用户登录
POST /api/v1/auth/login
Request: { email, password }
Response: { success, token, user }

// 刷新 Token
POST /api/v1/auth/refresh
Request: { refreshToken }
Response: { success, token }

// 获取当前用户
GET /api/v1/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success, user }
```

### 4.2 用户管理接口

```typescript
// 获取用户列表（管理员）
GET /api/v1/users
Response: { success, users, total }

// 更新用户配额（管理员）
PUT /api/v1/users/:id/quota
Request: { quotaLimit }
Response: { success, user }

// 更新用户状态（管理员）
PUT /api/v1/users/:id/status
Request: { status }
Response: { success, user }
```

### 4.3 统计接口

```typescript
// 获取使用统计概览
GET /api/v1/statistics/overview
Response: { 
    today: { calls, tokens, cost },
    week: { calls, tokens, cost },
    month: { calls, tokens, cost }
}

// 获取使用趋势
GET /api/v1/statistics/trend?period=week
Response: { 
    labels: ['周一', '周二', ...],
    data: [100, 150, ...]
}

// 获取模型使用分布
GET /api/v1/statistics/distribution
Response: {
    byModel: [{ model: 'qwen-turbo', count: 100, tokens: 50000 }, ...],
    byCost: [{ model: 'gpt-4', cost: 10.5 }, ...]
}

// 导出统计报表
GET /api/v1/statistics/export?format=csv&startDate=xxx&endDate=xxx
Response: CSV 文件
```

### 4.4 模板接口

```typescript
// 获取模板列表
GET /api/v1/templates?category=xxx
Response: { success, templates, total }

// 使用模板创建工作流
POST /api/v1/templates/:id/use
Response: { success, chatflow }

// 分享工作流为模板
POST /api/v1/templates
Request: { chatflowId, name, description, category, isPublic }
Response: { success, template }
```

### 4.5 评测接口

```typescript
// 执行模型评测
POST /api/v1/evaluation/run
Request: { 
    input: "测试问题",
    models: ["qwen-turbo", "ernie-bot", "glm-4"]
}
Response: {
    results: [
        { model: "qwen-turbo", output: "...", latency: 1200, tokens: 256 },
        { model: "ernie-bot", output: "...", latency: 1800, tokens: 312 },
        ...
    ]
}

// 获取评测历史
GET /api/v1/evaluation/history
Response: { success, evaluations }
```


---

## 五、界面设计

### 5.1 页面结构

```
┌─────────────────────────────────────────────────────────────────┐
│  Logo    工作流    模板市场    统计    评测    设置    用户头像  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         主内容区域                               │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 主要页面

#### 5.2.1 登录页面
- 邮箱/密码登录表单
- 注册入口链接
- 忘记密码链接

#### 5.2.2 工作流编辑器
- 左侧：节点面板（分类展示）
- 中间：画布区域（React Flow）
- 右侧：节点配置面板
- 顶部：工具栏（保存、运行、导出）

#### 5.2.3 统计面板
- 顶部：关键指标卡片
- 中部：使用趋势图表
- 底部：模型分布饼图

#### 5.2.4 模板市场
- 分类筛选
- 模板卡片网格
- 模板详情弹窗

#### 5.2.5 模型评测
- 输入区域
- 模型选择
- 结果对比表格

### 5.3 中文化范围

| 模块 | 中文化内容 |
|------|-----------|
| 导航菜单 | 工作流、模板市场、统计、设置 |
| 节点分类 | 聊天模型、语言模型、工具、记忆、链 |
| 节点名称 | 通义千问、文心一言、智谱GLM... |
| 表单标签 | API密钥、模型名称、温度、最大Token |
| 提示信息 | 保存成功、执行失败、配额不足 |
| 错误信息 | 网络错误、认证失败、参数无效 |

---

## 六、部署架构

### 6.1 Docker Compose 部署

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_TYPE=postgres
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USER=flowise
      - DATABASE_PASSWORD=flowise123
      - DATABASE_NAME=flowise
      - REDIS_HOST=redis
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=flowise
      - POSTGRES_PASSWORD=flowise123
      - POSTGRES_DB=flowise
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 6.2 环境变量配置

```bash
# 数据库配置
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=flowise
DATABASE_PASSWORD=your_password
DATABASE_NAME=flowise

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# 加密配置
ENCRYPTION_KEY=your-32-char-encryption-key

# 应用配置
PORT=3000
NODE_ENV=production
```

---

## 七、测试策略

### 7.1 测试类型

| 测试类型 | 覆盖范围 | 工具 |
|---------|---------|------|
| 单元测试 | 工具函数、服务类 | Jest |
| 集成测试 | API 接口 | Supertest |
| E2E 测试 | 关键用户流程 | Cypress |

### 7.2 测试用例示例

```typescript
// 用户认证测试
describe('Auth API', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ username: 'test', email: 'test@test.com', password: '123456' })
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
    })

    it('should login with correct credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@test.com', password: '123456' })
        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
    })
})

// 模型调用测试
describe('Model Gateway', () => {
    it('should call Qwen model successfully', async () => {
        const result = await qwenAdapter.chat([
            { role: 'user', content: '你好' }
        ])
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
    })
})
```

---

## 八、项目结构

```
flowise/
├── packages/
│   ├── components/                    # 节点组件
│   │   ├── nodes/
│   │   │   ├── chatmodels/
│   │   │   │   ├── ChatQwen/         # 通义千问节点 [新增]
│   │   │   │   ├── ChatWenxin/       # 文心一言节点 [新增]
│   │   │   │   ├── ChatZhipu/        # 智谱GLM节点 [新增]
│   │   │   │   ├── ChatXunfei/       # 讯飞星火节点 [新增]
│   │   │   │   ├── ChatKimi/         # Kimi节点 [新增]
│   │   │   │   ├── ChatDeepSeek/     # DeepSeek节点 [新增]
│   │   │   │   ├── ChatHunyuan/      # 腾讯混元节点 [新增]
│   │   │   │   └── ChatOllama/       # Ollama节点 [新增]
│   │   │   └── ...
│   │   └── src/
│   │
│   ├── server/                        # 后端服务
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           # 认证路由 [新增]
│   │   │   │   ├── users.ts          # 用户管理路由 [新增]
│   │   │   │   ├── statistics.ts     # 统计路由 [新增]
│   │   │   │   ├── templates.ts      # 模板路由 [新增]
│   │   │   │   ├── evaluation.ts     # 评测路由 [新增]
│   │   │   │   └── ...
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts   # 认证服务 [新增]
│   │   │   │   ├── user.service.ts   # 用户服务 [新增]
│   │   │   │   ├── stats.service.ts  # 统计服务 [新增]
│   │   │   │   └── ...
│   │   │   ├── database/
│   │   │   │   └── entities/
│   │   │   │       ├── User.ts       # 用户实体 [新增]
│   │   │   │       ├── ApiCredential.ts  # API凭证实体 [新增]
│   │   │   │       ├── UsageLog.ts   # 使用记录实体 [新增]
│   │   │   │       └── ...
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts    # 认证中间件 [新增]
│   │   │   │   └── quota.middleware.ts   # 配额中间件 [新增]
│   │   │   └── utils/
│   │   │       ├── encryption.ts     # 加密工具 [新增]
│   │   │       └── ...
│   │   └── ...
│   │
│   └── ui/                            # 前端界面
│       ├── src/
│       │   ├── views/
│       │   │   ├── auth/             # 认证页面 [新增]
│       │   │   │   ├── Login.jsx
│       │   │   │   └── Register.jsx
│       │   │   ├── statistics/       # 统计页面 [新增]
│       │   │   │   └── index.jsx
│       │   │   ├── templates/        # 模板页面 [新增]
│       │   │   │   └── index.jsx
│       │   │   ├── evaluation/       # 评测页面 [新增]
│       │   │   │   └── index.jsx
│       │   │   └── ...
│       │   ├── locales/              # 国际化 [新增]
│       │   │   └── zh-CN.json
│       │   └── ...
│       └── ...
│
├── docker/
│   └── docker-compose.yml
├── docs/                              # 文档 [新增]
│   ├── deployment.md
│   └── api.md
└── README.md
```

---

## 九、开发里程碑

| 阶段 | 周次 | 目标 | 交付物 |
|------|------|------|--------|
| 环境搭建 | 第1周 | 本地运行 Flowise，理解架构 | 开发环境就绪 |
| 用户系统 | 第2周 | 完成认证和权限管理 | 登录注册功能 |
| 模型适配 | 第3-4周 | 完成 7 个国产模型节点 | 模型节点可用 |
| 本地模型 | 第5周 | 完成 Ollama 集成 | 本地模型可用 |
| 统计模块 | 第6周 | 完成使用统计面板 | 统计功能可用 |
| 模板市场 | 第7周 | 完成模板功能 | 模板功能可用 |
| 评测模块 | 第8周 | 完成模型评测 | 评测功能可用 |
| 中文化 | 第9周 | 完成界面本地化 | 中文界面 |
| 测试部署 | 第10周 | 完成测试和部署 | 可演示系统 |

---

## 十、风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| 模型 API 变更 | 中 | 中 | 关注官方文档，预留适配时间 |
| 时间不足 | 中 | 高 | 优先核心功能，其他标记"未来工作" |
| 技术难点 | 低 | 中 | 参考开源项目，及时求助 |
| 第三方服务不稳定 | 低 | 低 | 实现错误重试和降级机制 |
