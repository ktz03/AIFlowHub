# AIFlowHub 并行开发指南

## 🎯 开发环境配置

### 代码格式化钩子 (推荐配置)
在项目根目录创建 `.claude/settings.json`，添加 PostToolUse 钩子自动格式化代码：

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "pnpm run format || true" }]
    }
  ]
}
```

---

## 🔍 验证驱动开发原则

> **核心理念**: 给 AI 一个验证工作的方法，只要有反馈闭环，最终结果的质量会提升 2-3 倍。

### 验证工具矩阵
| 领域 | 验证方式 | 工具 | 自动化程度 |
|------|----------|------|------------|
| 后端 API | HTTP 请求 | curl + jq | ⭐⭐⭐ 全自动 |
| 前端 UI | 浏览器快照 | Chrome DevTools MCP | ⭐⭐⭐ 全自动 |
| 数据库 | 表结构查询 | sqlite3 CLI | ⭐⭐⭐ 全自动 |
| 集成测试 | 端到端流程 | MCP + curl 组合 | ⭐⭐ 半自动 |
| 构建检查 | 编译 + Lint | pnpm scripts | ⭐⭐⭐ 全自动 |

### 验证检查点规则
1. **每个阶段完成后必须验证** - 不要跳过验证直接进入下一阶段
2. **验证失败立即修复** - 不要积累问题到后面
3. **记录验证结果** - 在任务清单中标记 ✅ 或 ❌
4. **截图保存证据** - 使用 MCP 截图功能自动保存
5. **使用验证脚本** - 优先使用可重复执行的脚本验证


### 验证结果记录模板
```
📋 阶段验证报告 - [窗口名称] [阶段编号]
==========================================
验证时间: YYYY-MM-DD HH:mm
验证方式: [自动/手动]

✅ 通过项:
- [检查项1] - 响应时间 XXms
- [检查项2] - 截图: ./screenshots/xxx.png

❌ 失败项:
- [检查项3] - 错误: XXX
  修复方案: XXX

📊 通过率: X/Y (XX%)
🚦 阶段状态: ✅ 通过 / ❌ 阻塞
```

---

## 🖥️ 多窗口开发设置

### 窗口1: 后端API开发
```bash
cd D:\VSCode\java\毕业设计\Flowise
git checkout feature/backend-api
pnpm run dev --filter=flowise
```

### 窗口2: 前端UI开发
```bash
cd D:\VSCode\java\毕业设计\Flowise
git checkout feature/frontend-ui
pnpm run dev --filter=flowise-ui
```

### 窗口3: 模板市场开发
```bash
cd D:\VSCode\java\毕业设计\Flowise
git checkout feature/templates
```

---


## 📋 窗口1: feature/backend-api 任务清单

### 第一阶段 (Day 1-2) - 核心路由注册

#### 任务列表
- [ ] **1.1 注册新增API路由到 index.ts**
  - 文件: `packages/server/src/index.ts`
  - 添加: auth, usage-stats, quota, template-market, model-evaluation, chat-history 路由

- [ ] **1.2 运行数据库迁移**
  ```bash
  pnpm run migration:run
  ```

- [ ] **1.3 完善认证中间件**
  - 文件: `packages/server/src/middlewares/auth.middleware.ts`
  - 确保 JWT 验证正常工作

#### ✅ 第一阶段验证检查点

**前置条件**: 后端服务已启动 (`pnpm run dev --filter=flowise`)

**验证脚本** (复制到终端执行):
```bash
echo "========== 后端第一阶段验证 =========="
echo ""

echo "1️⃣ 检查服务是否启动..."
curl -s -o /dev/null -w "健康检查: %{http_code}\n" http://localhost:3000/api/v1/ping

echo ""
echo "2️⃣ 验证路由注册 (期望: 非 404 响应)..."
echo "  /api/v1/auth/login: $(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/v1/auth/login)"
echo "  /api/v1/auth/register: $(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/v1/auth/register)"
echo "  /api/v1/usage-stats: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/usage-stats)"
echo "  /api/v1/quota: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/quota)"
echo "  /api/v1/templates: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/templates)"
echo "  /api/v1/chat-history: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/chat-history)"

echo ""
echo "3️⃣ 验证数据库表..."
sqlite3 packages/server/flowise.db ".tables" | grep -E "user|usage_log|custom_template"

echo ""
echo "========== 验证完成 =========="
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 服务启动 | HTTP 200 | [ ] |
| auth 路由 | 非 404 (400/401 均可) | [ ] |
| usage-stats 路由 | 非 404 | [ ] |
| quota 路由 | 非 404 | [ ] |
| templates 路由 | 非 404 | [ ] |
| chat-history 路由 | 非 404 | [ ] |
| user 表存在 | 显示 user | [ ] |
| usage_log 表存在 | 显示 usage_log | [ ] |

**通过条件**: 8/8 项全部通过

---


### 第二阶段 (Day 3-4) - API完善

#### 任务列表
- [ ] **2.1 完善用户认证服务**
  - 文件: `packages/server/src/services/auth/index.ts`
  - 添加: 密码加密、Token刷新、登出逻辑

- [ ] **2.2 完善配额管理API**
  - 文件: `packages/server/src/services/quota/index.ts`
  - 添加: 配额检查、预警通知

- [ ] **2.3 完善使用统计API**
  - 文件: `packages/server/src/services/usage-stats/index.ts`
  - 添加: 数据聚合、图表数据接口

#### ✅ 第二阶段验证检查点

**验证脚本** (分步执行):
```bash
echo "========== 后端第二阶段验证 =========="

# Step 1: 用户注册
echo "1️⃣ 测试用户注册..."
REGISTER_RESULT=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!","email":"test@example.com"}')
echo "注册响应: $REGISTER_RESULT"

# Step 2: 用户登录
echo ""
echo "2️⃣ 测试用户登录..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!"}')
echo "登录响应: $LOGIN_RESULT"

# 提取 token (需要 jq 工具，或手动复制)
TOKEN=$(echo $LOGIN_RESULT | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "获取到 Token: ${TOKEN:0:20}..."

# Step 3: 测试需要认证的 API
echo ""
echo "3️⃣ 测试配额 API (需要 Token)..."
curl -s http://localhost:3000/api/v1/quota \
  -H "Authorization: Bearer $TOKEN" | head -c 200

echo ""
echo "4️⃣ 测试使用统计 API..."
curl -s http://localhost:3000/api/v1/usage-stats \
  -H "Authorization: Bearer $TOKEN" | head -c 200

echo ""
echo "========== 验证完成 =========="
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 用户注册 | 返回 user 对象或成功消息 | [ ] |
| 重复注册 | 返回 400 错误 | [ ] |
| 用户登录 | 返回 token 字段 | [ ] |
| 错误密码登录 | 返回 401 错误 | [ ] |
| 配额 API | 返回配额数据结构 | [ ] |
| 统计 API | 返回统计数据结构 | [ ] |
| 无 Token 访问 | 返回 401 错误 | [ ] |

**通过条件**: 7/7 项全部通过

---


### 第三阶段 (Day 5-7) - 测试与优化

#### 任务列表
- [ ] **3.1 API接口测试** - 编写单元测试
- [ ] **3.2 错误处理完善** - 统一错误响应格式
- [ ] **3.3 性能优化** - 添加缓存、优化查询

#### ✅ 第三阶段验证检查点

**验证脚本**:
```bash
echo "========== 后端第三阶段验证 =========="

# 1. 错误处理验证
echo "1️⃣ 错误处理测试..."
echo "  无效 Token:"
curl -s http://localhost:3000/api/v1/quota \
  -H "Authorization: Bearer invalid-token-12345" | head -c 100

echo ""
echo "  缺少必填字段:"
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}' | head -c 100

echo ""
echo "  无效 JSON:"
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d 'invalid json' | head -c 100

# 2. 性能测试 (简单版)
echo ""
echo "2️⃣ 响应时间测试..."
echo "  /api/v1/templates 响应时间:"
curl -s -o /dev/null -w "  %{time_total}s\n" http://localhost:3000/api/v1/templates

# 3. 测试套件
echo ""
echo "3️⃣ 运行测试套件..."
cd packages/server && pnpm test --passWithNoTests 2>/dev/null || echo "  测试套件未配置"

echo ""
echo "========== 验证完成 =========="
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 无效 Token | 返回 401 + 错误消息 | [ ] |
| 缺少字段 | 返回 400 + 字段说明 | [ ] |
| 无效 JSON | 返回 400 + 解析错误 | [ ] |
| API 响应时间 | < 200ms | [ ] |
| 错误格式统一 | `{error: string, code: number}` | [ ] |

**通过条件**: 5/5 项全部通过

---


## 📋 窗口2: feature/frontend-ui 任务清单

### 第一阶段 (Day 1-2) - 认证页面

#### 任务列表
- [ ] **1.1 完善登录页面**
  - 文件: `packages/ui/src/views/auth/Login.jsx`
  - 添加: 表单验证、错误提示、记住密码

- [ ] **1.2 完善注册页面**
  - 文件: `packages/ui/src/views/auth/Register.jsx`
  - 添加: 密码强度检测、邮箱验证

- [ ] **1.3 添加路由守卫**
  - 未登录用户重定向到登录页

#### ✅ 第一阶段验证检查点 (Chrome DevTools MCP)

**前置条件**: 前端服务已启动 (`pnpm run dev --filter=flowise-ui`)

**验证步骤** (使用 Chrome DevTools MCP):

```
步骤 1: 打开登录页
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/login")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 页面包含 "登录" 或 "Login" 文本
- 检查: 存在用户名输入框 (input)
- 检查: 存在密码输入框 (input type=password)
- 检查: 存在登录按钮 (button)

步骤 2: 测试空表单提交
- 调用: mcp_Chrome_DevTools_click(uid="登录按钮的uid")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 显示验证错误提示

步骤 3: 测试错误密码
- 调用: mcp_Chrome_DevTools_fill(uid="用户名输入框uid", value="wronguser")
- 调用: mcp_Chrome_DevTools_fill(uid="密码输入框uid", value="wrongpass")
- 调用: mcp_Chrome_DevTools_click(uid="登录按钮uid")
- 调用: mcp_Chrome_DevTools_wait_for(text="错误", timeout=5000)
- 检查: 显示 "用户名或密码错误" 类似提示

步骤 4: 打开注册页
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/register")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 页面包含 "注册" 或 "Register" 文本
- 检查: 存在密码确认输入框

步骤 5: 测试路由守卫
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/dashboard")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 自动跳转到 /login 页面
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 登录页渲染 | 无 JS 错误，表单完整 | [ ] |
| 空表单验证 | 显示必填提示 | [ ] |
| 错误密码提示 | 显示友好错误信息 | [ ] |
| 注册页渲染 | 无 JS 错误，表单完整 | [ ] |
| 密码强度指示 | 显示强度条/提示 | [ ] |
| 路由守卫 | 未登录跳转到 /login | [ ] |

**通过条件**: 6/6 项全部通过

---


### 第二阶段 (Day 3-4) - 功能页面

#### 任务列表
- [ ] **2.1 完善使用统计页面**
  - 文件: `packages/ui/src/views/usage-stats/index.jsx`
  - 添加: 图表展示、数据筛选

- [ ] **2.2 完善配额管理页面**
  - 文件: `packages/ui/src/views/quota/index.jsx`
  - 添加: 配额进度条、预警提示

- [ ] **2.3 完善聊天历史页面**
  - 文件: `packages/ui/src/views/chat-history/index.jsx`
  - 添加: 搜索、分页、导出功能

#### ✅ 第二阶段验证检查点 (Chrome DevTools MCP)

**前置条件**: 
- 后端服务已启动
- 已有测试用户登录态

**验证步骤**:

```
步骤 1: 使用统计页面
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/usage-stats")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 页面包含图表组件 (canvas 或 svg)
- 检查: 存在日期筛选器
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/usage-stats.png")

步骤 2: 配额管理页面
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/quota")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 存在进度条组件 (progressbar 或类似)
- 检查: 显示配额数值 (如 "已使用 X / Y")
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/quota.png")

步骤 3: 聊天历史页面
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/chat-history")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 存在搜索输入框
- 检查: 存在历史记录列表
- 检查: 存在分页组件
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/chat-history.png")

步骤 4: 数据加载状态
- 调用: mcp_Chrome_DevTools_emulate(networkConditions="Slow 3G")
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/usage-stats", type="reload")
- 检查: 显示 loading 状态 (Skeleton/Spinner)
- 调用: mcp_Chrome_DevTools_emulate(networkConditions="No emulation")
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 统计页图表 | 图表正常渲染 | [ ] |
| 日期筛选 | 筛选器可交互 | [ ] |
| 配额进度条 | 显示正确百分比 | [ ] |
| 配额预警 | 接近上限显示警告色 | [ ] |
| 历史列表 | 数据正常加载 | [ ] |
| 搜索功能 | 输入后过滤结果 | [ ] |
| 分页功能 | 切换页码正常 | [ ] |
| Loading 状态 | 慢网络显示加载中 | [ ] |

**通过条件**: 8/8 项全部通过

---


### 第三阶段 (Day 5-7) - 用户体验

#### 任务列表
- [ ] **3.1 添加加载状态** - Skeleton/Spinner 组件
- [ ] **3.2 完善错误处理** - 友好错误提示
- [ ] **3.3 响应式适配** - 移动端/平板适配

#### ✅ 第三阶段验证检查点 (Chrome DevTools MCP)

**验证步骤**:

```
步骤 1: 加载状态测试
- 调用: mcp_Chrome_DevTools_emulate(networkConditions="Slow 3G")
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/dashboard")
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/loading-state.png")
- 检查: 显示 Skeleton 或 Spinner
- 调用: mcp_Chrome_DevTools_emulate(networkConditions="No emulation")

步骤 2: 错误处理测试 (模拟后端关闭)
- 停止后端服务
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/usage-stats", type="reload")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 显示友好错误提示 (非技术性错误)
- 检查: 存在 "重试" 按钮
- 重启后端服务

步骤 3: 响应式测试 - 手机端
- 调用: mcp_Chrome_DevTools_resize_page(width=375, height=667)
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/dashboard")
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/mobile-375.png")
- 检查: 布局正常，无水平滚动条

步骤 4: 响应式测试 - 平板端
- 调用: mcp_Chrome_DevTools_resize_page(width=768, height=1024)
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/tablet-768.png")
- 检查: 布局正常

步骤 5: 响应式测试 - 桌面端
- 调用: mcp_Chrome_DevTools_resize_page(width=1920, height=1080)
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/desktop-1920.png")
- 检查: 布局正常，充分利用空间
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 加载状态 | 显示 Skeleton/Spinner | [ ] |
| 网络错误提示 | 友好提示 + 重试按钮 | [ ] |
| 手机端 (375px) | 布局正常 | [ ] |
| 平板端 (768px) | 布局正常 | [ ] |
| 桌面端 (1920px) | 布局正常 | [ ] |
| 无控制台错误 | Console 无红色错误 | [ ] |

**通过条件**: 6/6 项全部通过

---


## 📋 窗口3: feature/templates 任务清单

### 第一阶段 (Day 1-2) - 模板数据

#### 任务列表
- [ ] **1.1 创建官方模板JSON**
  - 位置: `packages/server/src/templates/`
  - 模板: 客服机器人、文档问答、代码助手

- [ ] **1.2 完善模板市场API**
  - 文件: `packages/server/src/services/template-market/index.ts`
  - 添加: 模板搜索、分类筛选

#### ✅ 第一阶段验证检查点

**验证脚本**:
```bash
echo "========== 模板第一阶段验证 =========="

# 1. 验证模板 JSON 格式
echo "1️⃣ 验证模板 JSON 格式..."
for file in packages/server/src/templates/*.json; do
  if [ -f "$file" ]; then
    node -e "JSON.parse(require('fs').readFileSync('$file'))" 2>/dev/null \
      && echo "  ✅ $file 格式正确" \
      || echo "  ❌ $file 格式错误"
  fi
done

# 2. 测试模板列表 API
echo ""
echo "2️⃣ 测试模板列表 API..."
TEMPLATES=$(curl -s http://localhost:3000/api/v1/templates)
echo "  返回模板数量: $(echo $TEMPLATES | grep -o '"id"' | wc -l)"

# 3. 测试模板搜索
echo ""
echo "3️⃣ 测试模板搜索..."
echo "  搜索 '客服': $(curl -s 'http://localhost:3000/api/v1/templates?search=客服' | head -c 100)"

# 4. 测试分类筛选
echo ""
echo "4️⃣ 测试分类筛选..."
echo "  分类 'chatbot': $(curl -s 'http://localhost:3000/api/v1/templates?category=chatbot' | head -c 100)"

# 5. 验证模板必填字段
echo ""
echo "5️⃣ 验证模板必填字段..."
echo $TEMPLATES | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
const templates = Array.isArray(data) ? data : data.templates || [];
const required = ['name', 'description', 'category', 'flowData'];
templates.forEach(t => {
  const missing = required.filter(f => !t[f]);
  if (missing.length) console.log('  ⚠️', t.name || 'Unknown', '缺少:', missing.join(', '));
  else console.log('  ✅', t.name, '字段完整');
});
"

echo ""
echo "========== 验证完成 =========="
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 模板 JSON 格式 | 所有文件格式正确 | [ ] |
| 模板列表 API | 返回 ≥ 3 个模板 | [ ] |
| 搜索功能 | 返回匹配结果 | [ ] |
| 分类筛选 | 返回对应分类 | [ ] |
| 必填字段 | name, description, category, flowData | [ ] |

**通过条件**: 5/5 项全部通过

---


### 第二阶段 (Day 3-4) - 模板页面

#### 任务列表
- [ ] **2.1 完善模板市场页面**
  - 文件: `packages/ui/src/views/template-market/index.jsx`
  - 添加: 模板卡片、预览、一键部署

- [ ] **2.2 添加模板详情页**
  - 添加: 模板说明、使用教程、评分

#### ✅ 第二阶段验证检查点 (Chrome DevTools MCP)

**验证步骤**:

```
步骤 1: 模板市场页面
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/template-market")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 存在模板卡片 (card 组件)
- 检查: 每个卡片包含标题、描述、分类标签
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/template-market.png")

步骤 2: 搜索功能
- 调用: mcp_Chrome_DevTools_fill(uid="搜索框uid", value="客服")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 模板列表已过滤

步骤 3: 分类筛选
- 调用: mcp_Chrome_DevTools_click(uid="分类标签uid")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 显示对应分类的模板

步骤 4: 模板预览
- 调用: mcp_Chrome_DevTools_click(uid="模板卡片uid")
- 调用: mcp_Chrome_DevTools_wait_for(text="预览", timeout=3000)
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 显示预览弹窗
- 检查: 弹窗包含节点连接图或节点列表
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/template-preview.png")

步骤 5: 一键部署
- 调用: mcp_Chrome_DevTools_click(uid="使用此模板按钮uid")
- 调用: mcp_Chrome_DevTools_wait_for(text="编辑", timeout=5000)
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 跳转到工作流编辑器
- 检查: 模板节点已加载
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 模板卡片显示 | 图片+标题+描述 | [ ] |
| 分类标签 | 可点击筛选 | [ ] |
| 搜索功能 | 实时过滤 | [ ] |
| 预览弹窗 | 显示节点图 | [ ] |
| 一键部署 | 成功导入编辑器 | [ ] |
| 导入后可编辑 | 节点可拖拽 | [ ] |

**通过条件**: 6/6 项全部通过

---


### 第三阶段 (Day 5-7) - 模板功能

#### 任务列表
- [ ] **3.1 模板收藏功能**
- [ ] **3.2 模板评分功能**
- [ ] **3.3 模板分享功能**

#### ✅ 第三阶段验证检查点

**验证步骤** (Chrome DevTools MCP + curl):

```
步骤 1: 收藏功能测试
- 调用: mcp_Chrome_DevTools_navigate_page(url="http://localhost:8080/template-market")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 调用: mcp_Chrome_DevTools_click(uid="收藏按钮uid")
- 检查: 图标变为已收藏状态 (实心/高亮)
- 调用: mcp_Chrome_DevTools_navigate_page(type="reload")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 收藏状态保持

步骤 2: 评分功能测试
- 调用: mcp_Chrome_DevTools_click(uid="模板卡片uid")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 调用: mcp_Chrome_DevTools_click(uid="第4颗星uid")
- 检查: 显示评分成功提示
- 检查: 平均分更新

步骤 3: 分享功能测试
- 调用: mcp_Chrome_DevTools_click(uid="分享按钮uid")
- 调用: mcp_Chrome_DevTools_take_snapshot()
- 检查: 显示分享弹窗
- 检查: 生成分享链接
- 调用: mcp_Chrome_DevTools_click(uid="复制链接按钮uid")
- 检查: 显示复制成功提示

步骤 4: 分享链接验证 (curl)
# 假设分享链接格式为 /share/{shareCode}
curl -s http://localhost:3000/api/v1/templates/share/SHARE_CODE
# 检查: 返回模板数据
```

**验证通过标准**:
| 检查项 | 期望结果 | 实际结果 |
|--------|----------|----------|
| 收藏按钮 | 点击后状态变化 | [ ] |
| 收藏持久化 | 刷新后状态保持 | [ ] |
| 评分功能 | 1-5星可选 | [ ] |
| 评分显示 | 显示平均分 | [ ] |
| 分享链接生成 | 返回有效链接 | [ ] |
| 分享链接访问 | 可打开模板 | [ ] |
| 复制功能 | 复制到剪贴板 | [ ] |

**通过条件**: 7/7 项全部通过

---


## 🔄 阶段合并验证

### 每周合并前检查清单

在合并分支到 `develop` 之前，执行以下验证：

```bash
echo "========== 合并前验证 =========="

# 1. 构建检查
echo "1️⃣ TypeScript 编译..."
pnpm run build 2>&1 | tail -5

# 2. Lint 检查
echo ""
echo "2️⃣ ESLint 检查..."
pnpm run lint 2>&1 | tail -10

# 3. 测试检查
echo ""
echo "3️⃣ 单元测试..."
pnpm test --passWithNoTests 2>&1 | tail -5

# 4. 数据库迁移检查
echo ""
echo "4️⃣ 数据库迁移..."
pnpm run migration:run 2>&1 | tail -3

echo ""
echo "========== 验证完成 =========="
```

### 合并后集成测试

```
步骤 1: 启动完整服务
- pnpm run dev

步骤 2: 端到端流程测试
- 用户注册 → 登录 → 创建工作流 → 运行 → 查看统计

步骤 3: 截图存档
- 调用: mcp_Chrome_DevTools_take_screenshot(filePath="./screenshots/integration-test.png")
```

---

## 🔗 远程仓库信息

- **仓库地址**: https://github.com/ktz03/AIFlowHub
- **默认分支**: develop
- **远程名称**: private

```bash
# 推送到远程
git push private <branch-name> --no-verify

# 拉取最新代码
git pull private <branch-name>
```

---

## 📊 甘特图时间线

```
Week 1:
├── 窗口1 (backend-api): [路由注册] [数据库迁移] [认证中间件] → 验证点1
├── 窗口2 (frontend-ui): [登录页面] [注册页面] [路由守卫] → 验证点1
└── 窗口3 (templates):   [模板JSON] [模板API] → 验证点1

Week 2:
├── 窗口1 (backend-api): [用户服务] [配额API] [统计API] → 验证点2
├── 窗口2 (frontend-ui): [统计页面] [配额页面] [历史页面] → 验证点2
└── 窗口3 (templates):   [市场页面] [详情页面] → 验证点2

Week 3:
├── 窗口1 (backend-api): [API测试] [错误处理] [性能优化] → 验证点3
├── 窗口2 (frontend-ui): [加载状态] [错误处理] [响应式] → 验证点3
└── 窗口3 (templates):   [收藏功能] [评分功能] [分享功能] → 验证点3

Week 4:
└── 全部分支: [合并验证] [集成测试] [Bug修复] [发布准备]
```

---

## 🎯 每日站会检查清单

### 窗口1 检查项
- [ ] 后端服务能正常启动？ (`pnpm run dev --filter=flowise`)
- [ ] API 接口能正常响应？ (curl 测试)
- [ ] 数据库迁移是否成功？ (sqlite3 检查)
- [ ] 当前阶段验证是否通过？

### 窗口2 检查项
- [ ] 前端页面能正常渲染？ (MCP snapshot)
- [ ] API 调用是否正确？ (Network 面板)
- [ ] 用户交互是否流畅？ (手动测试)
- [ ] 当前阶段验证是否通过？

### 窗口3 检查项
- [ ] 模板数据是否完整？ (JSON 验证)
- [ ] 模板预览是否正常？ (MCP 测试)
- [ ] 一键部署是否可用？ (端到端测试)
- [ ] 当前阶段验证是否通过？

---

## ⚠️ 注意事项

1. **避免冲突文件**:
   - `index.ts` 路由注册 → 只在 backend-api 分支修改
   - `dashboard.js` 菜单配置 → 只在 frontend-ui 分支修改

2. **共享修改**:
   - 如需修改共享文件，先在 develop 分支修改，再同步到各分支

3. **测试顺序**:
   - 后端API完成后 → 前端才能联调
   - 建议后端先完成第一阶段

4. **验证失败处理**:
   - 立即修复，不要跳过
   - 记录失败原因和修复方案
   - 修复后重新执行验证脚本

---

## 🚀 快速启动命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (全部)
pnpm run dev

# 只启动后端
pnpm run dev --filter=flowise

# 只启动前端
pnpm run dev --filter=flowise-ui

# 运行验证脚本
# 后端: 复制对应阶段的 bash 脚本到终端执行
# 前端: 使用 Chrome DevTools MCP 按步骤执行
```