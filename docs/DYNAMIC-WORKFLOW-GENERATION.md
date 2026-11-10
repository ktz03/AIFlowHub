# 动态工作流生成方案

## 问题分析

当前系统主要基于**模板匹配**,存在以下局限:

1. 只能生成预定义的几种工作流类型
2. 相同类别的需求生成相似的工作流
3. 无法处理复杂或特殊的需求
4. 扩展性差,每增加一种场景需要手动添加模板

## 解决方案

### 方案 1: LLM 驱动的节点组装(推荐)

**核心思路**: 让 LLM 分析用户需求,从节点库中选择合适的节点并动态组装

**优势**:

-   ✅ 真正的按需生成,不受模板限制
-   ✅ 可以处理复杂和特殊需求
-   ✅ 扩展性强,只需扩展节点库
-   ✅ 生成的工作流更贴合用户需求

**实现步骤**:

1. **构建节点库** (`node-library.ts`)

```typescript
// 定义所有可用节点的元数据
const NODE_LIBRARY = {
    chatModels: [
        {
            name: 'chatDeepseek',
            capabilities: ['对话', '代码生成', '文本理解'],
            inputTypes: [],
            outputType: 'BaseChatModel',
            config: { temperature: 0.7 }
        }
    ],
    memory: [
        {
            name: 'bufferMemory',
            capabilities: ['对话历史', '上下文记忆'],
            inputTypes: [],
            outputType: 'BaseMemory'
        }
    ],
    chains: [
        {
            name: 'conversationChain',
            capabilities: ['对话管理', '多轮对话'],
            inputTypes: ['BaseChatModel', 'BaseMemory?'],
            outputType: 'ConversationChain'
        },
        {
            name: 'retrievalQAChain',
            capabilities: ['RAG问答', '知识库检索'],
            inputTypes: ['BaseChatModel', 'BaseRetriever'],
            outputType: 'RetrievalQAChain'
        }
    ],
    retrievers: [
        {
            name: 'vectorStoreRetriever',
            capabilities: ['向量检索', '语义搜索'],
            inputTypes: ['VectorStore'],
            outputType: 'BaseRetriever'
        }
    ],
    tools: [
        {
            name: 'jimengImageGen',
            capabilities: ['图片生成', '文生图'],
            inputTypes: [],
            outputType: 'Tool'
        }
    ]
}
```

2. **LLM 需求分析** (`requirement-analyzer.ts`)

```typescript
async function analyzeRequirements(userDescription: string) {
    const prompt = `分析用户需求,返回JSON格式的工作流设计:
  
用户需求: ${userDescription}

可用节点类型:
- chatModels: 对话模型
- memory: 记忆组件
- chains: 链式组件
- retrievers: 检索器
- tools: 工具

返回格式:
{
  "nodes": [
    { "type": "chatDeepseek", "purpose": "提供对话能力" },
    { "type": "conversationChain", "purpose": "管理对话流程" }
  ],
  "connections": [
    { "from": "chatDeepseek", "to": "conversationChain", "input": "model" }
  ],
  "config": {
    "systemPrompt": "...",
    "temperature": 0.7
  }
}`

    const response = await callLLM(prompt)
    return JSON.parse(response)
}
```

3. **动态组装** (`workflow-assembler.ts`)

```typescript
async function assembleWorkflow(requirements) {
    const nodes = []
    const edges = []

    // 为每个需求的节点创建实例
    for (const req of requirements.nodes) {
        const nodeTemplate = NODE_LIBRARY.findNode(req.type)
        const node = createNodeInstance(nodeTemplate, req.config)
        nodes.push(node)
    }

    // 创建连接
    for (const conn of requirements.connections) {
        const edge = createEdge(conn.from, conn.to, conn.input)
        edges.push(edge)
    }

    // 计算布局
    calculateLayout(nodes)

    return { nodes, edges }
}
```

4. **智能布局** (`smart-layout.ts`)

```typescript
function calculateLayout(nodes) {
    // 使用拓扑排序确定层级
    const layers = topologicalSort(nodes)

    // 每层节点水平排列
    layers.forEach((layer, layerIndex) => {
        layer.forEach((node, nodeIndex) => {
            node.position = {
                x: 400 + layerIndex * 600,
                y: 300 + nodeIndex * 350
            }
        })
    })
}
```

### 方案 2: 模板库扩展

如果暂时不想实现完全动态生成,可以先**扩展模板库**:

**新增模板类型**:

1. **RAG 文档问答**

```typescript
{
    nodes: [ChatDeepseek, VectorStoreRetriever, RetrievalQAChain]
}
```

2. **多轮对话 + 工具调用**

```typescript
{
    nodes: [ChatDeepseek, BufferMemory, AgentExecutor, [Tool1, Tool2, Tool3]]
}
```

3. **数据分析工作流**

```typescript
{
    nodes: [DataLoader, DataProcessor, ChatDeepseek, ChartGenerator]
}
```

4. **内容生成工作流**

```typescript
{
    nodes: [ChatDeepseek(创意生成), ChatDeepseek(内容扩写), ChatDeepseek(质量审核)]
}
```

5. **多模态工作流**

```typescript
{
    nodes: [ImageInput, VisionModel, ChatDeepseek, ImageGenerator]
}
```

### 方案 3: 混合模式

结合两种方案的优势:

1. **常见场景**: 使用优化的模板(快速、稳定)
2. **特殊需求**: 使用动态生成(灵活、强大)
3. **自动选择**: 系统根据需求复杂度自动选择模式

```typescript
async function generateWorkflow(description: string) {
    // 1. 评估需求复杂度
    const complexity = await evaluateComplexity(description)

    // 2. 选择生成模式
    if (complexity < 0.5) {
        // 简单需求 -> 模板模式
        return generateFromTemplate(description)
    } else {
        // 复杂需求 -> 动态模式
        return generateDynamically(description)
    }
}
```

## 实施建议

### 短期(1-2 周)

1. ✅ 修复当前布局和连接问题
2. ✅ 扩展模板库到 10 个常见场景 (已完成 2026-01-28)
3. ✅ 优化模板定制逻辑
4. ⏳ 测试所有新模板的可用性

### 中期(1 个月)

1. ⏳ 实现节点库系统 (node-library.ts)
2. ⏳ 实现 LLM 驱动的需求分析增强
3. ⏳ 实现动态节点组装 (workflow-assembler.ts)
4. ⏳ 实现智能布局算法 (smart-layout.ts)

### 长期(2-3 个月)

1. ⏳ 支持用户自定义节点
2. ⏳ 支持工作流版本管理
3. ⏳ 支持工作流市场/分享
4. ⏳ 支持可视化编辑生成的工作流

## 当前进度 (2026-01-28)

### ✅ 已完成

-   布局和连接问题修复
-   模板库扩展到 10 个 (客服、文档问答、代码、图片、写作、翻译、数据分析、总结、邮件、教育)
-   模板定制系统 (TemplateCustomizer)
-   工作流验证系统 (WorkflowValidator)
-   Skills 知识库集成
-   意图识别优化

### 🔄 进行中

-   测试新增的 4 个模板
-   收集用户反馈

### ⏳ 待开始

-   节点库系统设计与实现
-   动态工作流生成引擎
-   智能布局算法

## 参考资源

### 开源项目

1. **LangGraph** - LangChain 的图形工作流框架
2. **n8n** - 开源工作流自动化平台
3. **Flowise** - 可视化 LangChain 工作流构建器
4. **Dify** - LLM 应用开发平台

### 技术文档

1. LangChain Expression Language (LCEL)
2. LangGraph 动态图构建
3. ReactFlow 节点布局算法
4. Dagre 图布局库

## 下一步行动

1. **立即**: 修复当前的布局和连接问题 ✅
2. **本周**: 添加 5-10 个新模板
3. **下周**: 开始实现动态生成原型
4. **持续**: 收集用户反馈,优化生成质量

## 测试用例

### 简单场景(应使用模板)

-   "创建一个客服机器人"
-   "我需要一个代码助手"
-   "帮我做一个图片生成工具"

### 复杂场景(应使用动态生成)

-   "创建一个能够分析 PDF 文档、提取关键信息、生成摘要、并根据内容生成配图的工作流"
-   "我需要一个多步骤的数据处理流程:先清洗数据,然后分析趋势,最后生成可视化报告"
-   "构建一个智能客服系统,能够理解用户意图、查询知识库、调用外部 API、并生成个性化回复"

### 边界场景

-   "创建一个 XXX" (需求不明确)
-   "帮我做个很厉害的 AI" (过于模糊)
-   "我要一个能做所有事情的工作流" (不现实)
