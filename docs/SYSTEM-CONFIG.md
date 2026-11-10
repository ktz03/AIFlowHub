# 系统配置功能

## 概述

系统配置功能允许管理员设置系统级别的 API Key 和配置，这些配置可以被特定功能使用，但用户无法直接访问或在其他地方使用。

## 主要特性

### 1. 工作流生成器专用 API Key

-   **目的**: 为所有用户提供免费的工作流生成功能
-   **安全性**: API Key 加密存储，用户无法在其他地方调用
-   **隔离性**: 仅工作流生成器可以使用此 API Key
-   **灵活性**: 管理员可以随时更换 API Key 和模型

### 2. 加密存储

-   使用 AES-256-CBC 加密算法
-   每次加密使用随机 IV（初始化向量）
-   加密密钥从环境变量读取（`ENCRYPTION_KEY`）

## 架构设计

### 数据库表结构

```sql
CREATE TABLE system_config (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    isEncrypted BOOLEAN DEFAULT 0,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 后端架构

```
routes/system-config/
  └── index.ts                    # 路由定义（需要管理员权限）

controllers/system-config/
  └── index.ts                    # 控制器逻辑

services/system-config/
  └── index.ts                    # 业务逻辑
      ├── encrypt()               # 加密函数
      ├── decrypt()               # 解密函数
      ├── getSystemConfig()       # 获取配置
      ├── setSystemConfig()       # 设置配置
      ├── getWorkflowGeneratorApiKey()  # 获取工作流 API Key
      └── getWorkflowGeneratorModel()   # 获取工作流模型

database/entities/
  └── SystemConfig.ts             # 数据库实体

database/migrations/
  └── 1736400000000-AddSystemConfig.ts  # 数据库迁移
```

### 前端架构

```
views/system-config/
  └── index.jsx                   # 系统配置页面（管理员专用）

api/
  └── systemConfig.js             # API 调用封装

routes/
  └── MainRoutes.jsx              # 路由配置

menu-items/
  └── dashboard.js                # 菜单项（仅管理员可见）
```

## 使用方法

### 管理员配置

1. 以管理员身份登录
2. 在侧边栏找到 "System Config" 菜单
3. 输入 DeepSeek API Key
4. 选择模型（deepseek-chat 或 deepseek-coder）
5. 点击"保存配置"

### 在代码中使用

```typescript
import { getWorkflowGeneratorApiKey, getWorkflowGeneratorModel } from '../system-config'

// 获取系统 API Key
const apiKey = await getWorkflowGeneratorApiKey()
const model = await getWorkflowGeneratorModel()

// 使用 LLM 服务时指定使用系统 API Key
const result = await chat(
    {
        useSystemApiKey: true, // 使用系统 API Key
        temperature: 0.7
    },
    messages
)
```

## API 端点

### 管理员端点（需要管理员权限）

```
GET    /api/v1/system-config                          # 获取所有配置
GET    /api/v1/system-config/:key                     # 获取单个配置
POST   /api/v1/system-config                          # 设置配置
DELETE /api/v1/system-config/:key                     # 删除配置
POST   /api/v1/system-config/workflow-generator/api-key  # 设置工作流 API Key
GET    /api/v1/system-config/workflow-generator/status   # 检查配置状态
```

### 请求示例

#### 设置工作流生成器 API Key

```bash
curl -X POST http://localhost:3000/api/v1/system-config/workflow-generator/api-key \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-...",
    "model": "deepseek-chat"
  }'
```

#### 检查配置状态

```bash
curl http://localhost:3000/api/v1/system-config/workflow-generator/status \
  -H "Authorization: Bearer <admin-token>"
```

响应：

```json
{
    "isConfigured": true,
    "model": "deepseek-chat"
}
```

## 安全考虑

### 1. 权限控制

-   所有系统配置端点都需要管理员权限
-   使用 `authenticate` 和 `adminOnly` 中间件保护
-   前端菜单仅对管理员可见

### 2. 加密存储

-   敏感数据（如 API Key）使用 AES-256-CBC 加密
-   加密密钥从环境变量读取
-   每次加密使用随机 IV，防止相同明文产生相同密文

### 3. 使用隔离

-   系统 API Key 仅在特定服务中可用
-   用户无法通过任何 API 直接获取 API Key
-   工作流生成器内部调用时自动使用系统 API Key

### 4. 环境变量

建议在 `.env` 文件中设置：

```env
# 系统配置加密密钥（32字节）
ENCRYPTION_KEY=your-32-byte-encryption-key-here
```

## 工作流程

### 配置流程

```
管理员登录
    ↓
访问系统配置页面
    ↓
输入 API Key 和模型
    ↓
后端加密存储到数据库
    ↓
配置完成
```

### 使用流程

```
用户请求生成工作流
    ↓
工作流生成器服务
    ↓
调用 LLM 服务（useSystemApiKey=true）
    ↓
从系统配置获取 API Key（自动解密）
    ↓
调用 DeepSeek API
    ↓
返回生成结果
```

## 测试

运行测试脚本检查配置：

```bash
node test-system-config.js
```

## 扩展性

系统配置功能设计为通用的，可以轻松添加其他系统级配置：

```typescript
// 添加新的配置键
export const SYSTEM_CONFIG_KEYS = {
    WORKFLOW_GENERATOR_API_KEY: 'workflow_generator_api_key',
    WORKFLOW_GENERATOR_MODEL: 'workflow_generator_model',
    // 添加新配置
    ANOTHER_API_KEY: 'another_api_key',
    ANOTHER_SETTING: 'another_setting'
}

// 添加新的获取函数
export const getAnotherApiKey = async (): Promise<string | null> => {
    return await getSystemConfig(SYSTEM_CONFIG_KEYS.ANOTHER_API_KEY)
}
```

## 故障排查

### 配置未生效

1. 检查数据库迁移是否运行：`npm run build && npm start`
2. 检查 `system_config` 表是否存在：`node test-system-config.js`
3. 检查管理员权限是否正确

### 加密/解密失败

1. 确保 `ENCRYPTION_KEY` 环境变量已设置
2. 检查加密密钥长度（建议 32 字节）
3. 查看服务器日志获取详细错误信息

### API Key 无法使用

1. 确认 API Key 格式正确（sk-...）
2. 检查 DeepSeek API 配额
3. 验证网络连接

## 相关文件

-   后端服务: `packages/server/src/services/system-config/`
-   前端页面: `packages/ui/src/views/system-config/`
-   数据库实体: `packages/server/src/database/entities/SystemConfig.ts`
-   数据库迁移: `packages/server/src/database/migrations/sqlite/1736400000000-AddSystemConfig.ts`
-   LLM 服务: `packages/server/src/services/llm/index.ts`
-   工作流生成器: `packages/server/src/services/workflow-generator/`
