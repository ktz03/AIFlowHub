# 需求文档

## 项目信息

- **选题名称**：支持多源异构大模型的可视化应用构建平台研究与实现
- **英文名称**：Research and Implementation of Visual Application Building Platform Supporting Multi-source Heterogeneous Large Models
- **基础项目**：Flowise (https://github.com/FlowiseAI/Flowise)
- **参考项目**：one-api, Dify, LangFlow, FastGPT

---

## 引言

### 研究背景

随着 ChatGPT、文心一言、通义千问等大语言模型（LLM）的快速发展，AI 应用开发进入了新的阶段。然而，当前大模型应用开发面临以下挑战：

1. **接口异构性**：不同厂商的大模型 API 接口差异大，集成成本高
2. **开发门槛高**：构建 AI 应用需要较强的编程能力
3. **国产模型支持不足**：现有开源平台对国内大模型支持有限
4. **缺乏统一管理**：多模型场景下的用户管理、成本控制困难

### 研究意义

本项目旨在构建一个支持多源异构大模型的可视化应用构建平台，具有以下意义：

1. 降低 AI 应用开发门槛，让非专业开发者也能构建 AI 应用
2. 统一国内外大模型接口，简化多模型集成
3. 提供可视化工作流编排能力，提升开发效率
4. 支持多用户管理和成本控制，满足企业级需求

---

## 术语表

| 术语 | 定义 |
|------|------|
| **大语言模型（LLM）** | Large Language Model，基于深度学习的自然语言处理模型 |
| **工作流（Workflow）** | 由多个节点组成的数据处理流程 |
| **节点（Node）** | 工作流中的基本处理单元，如 LLM 调用、条件判断等 |
| **模型提供商（Provider）** | 提供大模型 API 服务的厂商，如 OpenAI、阿里云等 |
| **Token** | 大模型处理文本的基本单位，用于计费 |
| **流式响应（Streaming）** | 大模型逐字返回结果的响应方式 |
| **API Key** | 调用大模型 API 的身份凭证 |
| **多租户（Multi-tenant）** | 支持多个用户独立使用同一系统的架构 |

---

## 需求规格

### 需求 1：国产大模型适配

**用户故事**：作为平台用户，我希望能够在工作流中使用国产大模型，以便利用国内模型的优势并降低使用成本。

#### 验收标准

1. WHEN 用户在工作流编辑器中添加 LLM 节点 THEN 系统 SHALL 显示包含通义千问、文心一言、智谱 GLM、讯飞星火、月之暗面 Kimi、DeepSeek、腾讯混元在内的国产模型选项
2. WHEN 用户配置国产模型的 API Key THEN 系统 SHALL 安全存储凭证并支持连接测试
3. WHEN 用户调用国产模型 THEN 系统 SHALL 返回与 OpenAI 格式兼容的响应结构
4. WHEN 国产模型支持流式输出 THEN 系统 SHALL 实现流式响应的统一处理
5. WHEN 模型调用发生错误 THEN 系统 SHALL 返回标准化的错误信息和错误码

---

### 需求 2：本地模型支持

**用户故事**：作为注重数据隐私的用户，我希望能够接入本地部署的开源模型，以便在不上传数据到云端的情况下使用 AI 能力。

#### 验收标准

1. WHEN 用户添加 Ollama 节点 THEN 系统 SHALL 支持配置本地 Ollama 服务地址
2. WHEN 用户选择本地模型 THEN 系统 SHALL 自动获取 Ollama 中已安装的模型列表
3. WHEN 调用本地模型 THEN 系统 SHALL 支持与云端模型相同的调用方式
4. IF Ollama 服务不可用 THEN 系统 SHALL 显示明确的连接错误提示

---

### 需求 3：用户认证与授权

**用户故事**：作为平台管理员，我希望系统支持用户注册和登录，以便控制平台访问权限。

#### 验收标准

1. WHEN 新用户访问平台 THEN 系统 SHALL 显示登录页面并提供注册入口
2. WHEN 用户提交注册信息 THEN 系统 SHALL 验证用户名和邮箱唯一性
3. WHEN 用户登录成功 THEN 系统 SHALL 生成 JWT Token 并设置合理的过期时间
4. WHEN 用户访问受保护资源 THEN 系统 SHALL 验证 Token 有效性
5. WHEN Token 过期或无效 THEN 系统 SHALL 返回 401 状态码并引导重新登录
6. WHEN 用户密码存储 THEN 系统 SHALL 使用 bcrypt 算法进行加密

---

### 需求 4：用户角色与权限管理

**用户故事**：作为平台管理员，我希望能够管理不同角色的用户权限，以便实现精细化的访问控制。

#### 验收标准

1. WHEN 系统初始化 THEN 系统 SHALL 创建管理员（admin）和普通用户（user）两种角色
2. WHEN 管理员登录 THEN 系统 SHALL 显示用户管理、系统配置等管理功能
3. WHEN 普通用户登录 THEN 系统 SHALL 仅显示工作流编辑、个人设置等基础功能
4. WHEN 管理员修改用户角色 THEN 系统 SHALL 立即更新该用户的权限
5. WHEN 用户访问无权限的功能 THEN 系统 SHALL 返回 403 状态码

---

### 需求 5：API 密钥管理

**用户故事**：作为平台用户，我希望能够安全地管理我的各个模型提供商的 API 密钥，以便在工作流中使用不同的模型。

#### 验收标准

1. WHEN 用户添加 API 密钥 THEN 系统 SHALL 使用 AES-256 算法加密存储
2. WHEN 用户查看已保存的密钥 THEN 系统 SHALL 仅显示密钥的部分字符（如 sk-***xxx）
3. WHEN 用户测试密钥连接 THEN 系统 SHALL 调用对应模型的验证接口并返回结果
4. WHEN 用户删除密钥 THEN 系统 SHALL 同时清理相关的使用记录
5. WHEN 密钥调用失败 THEN 系统 SHALL 记录失败原因但不暴露完整密钥

---

### 需求 6：工作流创建与编辑

**用户故事**：作为平台用户，我希望能够通过可视化界面创建和编辑 AI 工作流，以便快速构建 AI 应用。

#### 验收标准

1. WHEN 用户创建新工作流 THEN 系统 SHALL 显示空白画布和节点面板
2. WHEN 用户从节点面板拖拽节点 THEN 系统 SHALL 在画布上创建对应节点
3. WHEN 用户连接两个节点 THEN 系统 SHALL 验证连接的有效性（输入输出类型匹配）
4. WHEN 用户配置节点参数 THEN 系统 SHALL 实时保存配置
5. WHEN 用户保存工作流 THEN 系统 SHALL 持久化节点、连接和配置信息
6. WHEN 用户打开已有工作流 THEN 系统 SHALL 完整恢复画布状态

---

### 需求 7：工作流执行

**用户故事**：作为平台用户，我希望能够执行创建的工作流并查看结果，以便验证工作流的正确性。

#### 验收标准

1. WHEN 用户点击执行按钮 THEN 系统 SHALL 按拓扑顺序执行工作流节点
2. WHEN 工作流执行中 THEN 系统 SHALL 实时显示当前执行的节点
3. WHEN LLM 节点执行 THEN 系统 SHALL 支持流式显示模型输出
4. WHEN 节点执行失败 THEN 系统 SHALL 标记失败节点并显示错误信息
5. WHEN 工作流执行完成 THEN 系统 SHALL 显示最终输出和执行统计

---

### 需求 8：使用量统计

**用户故事**：作为平台用户，我希望能够查看我的模型使用情况，以便了解使用成本和优化使用策略。

#### 验收标准

1. WHEN 用户调用任意模型 THEN 系统 SHALL 记录调用时间、模型名称、Token 消耗
2. WHEN 用户访问统计页面 THEN 系统 SHALL 显示今日、本周、本月的使用汇总
3. WHEN 用户查看详细统计 THEN 系统 SHALL 按模型、按日期展示使用明细
4. WHEN 系统计算成本 THEN 系统 SHALL 根据各模型的定价计算预估费用
5. WHEN 用户导出统计数据 THEN 系统 SHALL 支持导出 CSV 格式的报表

---

### 需求 9：用户配额管理

**用户故事**：作为平台管理员，我希望能够为用户设置使用配额，以便控制平台的整体使用成本。

#### 验收标准

1. WHEN 管理员设置用户配额 THEN 系统 SHALL 保存 Token 数量限制
2. WHEN 用户使用量接近配额（80%）THEN 系统 SHALL 显示警告提示
3. WHEN 用户使用量达到配额 THEN 系统 SHALL 阻止新的模型调用
4. WHEN 管理员调整配额 THEN 系统 SHALL 立即生效
5. WHEN 配额周期重置（如每月）THEN 系统 SHALL 自动清零已用量

---

### 需求 10：界面本地化

**用户故事**：作为中国用户，我希望平台界面是中文的，以便更方便地使用系统。

#### 验收标准

1. WHEN 用户访问平台 THEN 系统 SHALL 默认显示中文界面
2. WHEN 显示节点名称 THEN 系统 SHALL 使用中文标签（如"大语言模型"而非"LLM"）
3. WHEN 显示错误信息 THEN 系统 SHALL 使用中文描述
4. WHEN 显示帮助文档 THEN 系统 SHALL 提供中文说明
5. WHERE 用户选择切换语言 THEN 系统 SHALL 支持中英文切换

---

### 需求 11：工作流模板

**用户故事**：作为新用户，我希望能够使用预置的工作流模板，以便快速上手并了解平台能力。

#### 验收标准

1. WHEN 用户访问模板市场 THEN 系统 SHALL 显示分类的模板列表
2. WHEN 用户预览模板 THEN 系统 SHALL 显示模板的功能说明和节点结构
3. WHEN 用户使用模板 THEN 系统 SHALL 创建模板的副本到用户工作流
4. WHEN 管理员添加模板 THEN 系统 SHALL 支持设置模板分类和标签
5. WHEN 用户分享工作流为模板 THEN 系统 SHALL 支持公开或私有设置

---

### 需求 12：模型效果评测

**用户故事**：作为平台用户，我希望能够对比不同模型的效果，以便选择最适合我需求的模型。

#### 验收标准

1. WHEN 用户进入评测页面 THEN 系统 SHALL 显示模型选择和测试输入界面
2. WHEN 用户选择多个模型并输入测试问题 THEN 系统 SHALL 并行调用所选模型
3. WHEN 模型返回结果 THEN 系统 SHALL 并排显示各模型的输出
4. WHEN 显示评测结果 THEN 系统 SHALL 包含响应时间、Token 消耗、预估成本
5. WHEN 用户保存评测结果 THEN 系统 SHALL 记录评测历史供后续查看

---

### 需求 13：对话历史管理

**用户故事**：作为平台用户，我希望能够查看和管理我的对话历史，以便回顾之前的交互内容。

#### 验收标准

1. WHEN 用户与工作流对话 THEN 系统 SHALL 自动保存对话记录
2. WHEN 用户查看历史 THEN 系统 SHALL 按时间倒序显示对话列表
3. WHEN 用户搜索历史 THEN 系统 SHALL 支持按关键词搜索对话内容
4. WHEN 用户删除对话 THEN 系统 SHALL 永久删除相关记录
5. WHEN 用户导出对话 THEN 系统 SHALL 支持导出为 Markdown 格式

---

## 非功能性需求

### 性能需求

1. 页面首次加载时间 SHALL 不超过 3 秒
2. 工作流保存操作 SHALL 在 1 秒内完成
3. 系统 SHALL 支持至少 100 个并发用户
4. 模型调用的额外延迟 SHALL 不超过 500ms

### 安全需求

1. 所有 API 通信 SHALL 使用 HTTPS 加密
2. 用户密码 SHALL 使用 bcrypt 加密存储
3. API 密钥 SHALL 使用 AES-256 加密存储
4. 系统 SHALL 实现 CSRF 防护
5. 系统 SHALL 实现请求频率限制

### 可用性需求

1. 系统 SHALL 提供 Docker 一键部署方案
2. 系统 SHALL 支持 PostgreSQL 和 SQLite 数据库
3. 系统 SHALL 提供完整的部署文档

### 兼容性需求

1. 前端 SHALL 支持 Chrome、Firefox、Edge 最新版本
2. 前端 SHALL 支持 1920x1080 及以上分辨率
3. 后端 SHALL 支持 Node.js 18+ 运行环境

---

## 系统边界

### 包含范围

- 国产大模型（7个）和本地模型（Ollama）的适配
- 用户注册、登录、权限管理
- 可视化工作流编辑和执行
- 使用量统计和配额管理
- 界面中文化
- 工作流模板市场
- 模型效果评测
- 对话历史管理

### 不包含范围

- 移动端适配
- 大模型的训练和微调
- 复杂的 RAG 知识库系统
- 分布式部署和集群管理
- 计费和支付系统
- 第三方系统集成（如企业微信、钉钉）

---

## 参考资料

1. Flowise - https://github.com/FlowiseAI/Flowise
2. one-api - https://github.com/songquanpeng/one-api
3. Dify - https://github.com/langgenius/dify
4. LangFlow - https://github.com/langflow-ai/langflow
5. FastGPT - https://github.com/labring/FastGPT
6. 通义千问 API 文档 - https://help.aliyun.com/zh/dashscope
7. 文心一言 API 文档 - https://cloud.baidu.com/doc/WENXINWORKSHOP
8. 智谱 GLM API 文档 - https://open.bigmodel.cn/dev/api
