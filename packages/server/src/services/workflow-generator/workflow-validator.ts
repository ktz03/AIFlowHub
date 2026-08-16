/**
 * 工作流验证器
 * 确保生成的工作流可以正常使用
 */

import { WorkflowData } from './workflow-engine'

export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    fixes: string[]
}

export class WorkflowValidator {
    /**
     * 验证并修复工作流
     */
    validateAndFix(workflow: WorkflowData): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []
        const fixes: string[] = []

        // 1. 验证基本结构
        if (!workflow.nodes || workflow.nodes.length === 0) {
            errors.push('工作流没有节点')
            return { valid: false, errors, warnings, fixes }
        }

        // 2. 验证并修复每个节点
        for (const node of workflow.nodes) {
            this.validateAndFixNode(node, errors, warnings, fixes)
        }

        // 3. 验证连接
        if (workflow.edges) {
            this.validateEdges(workflow, errors, warnings)
        }

        // 4. 确保有输出节点
        const hasOutputNode = this.ensureOutputNode(workflow, warnings, fixes)
        if (!hasOutputNode) {
            warnings.push('工作流可能缺少输出节点')
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            fixes
        }
    }

    /**
     * 验证并修复节点
     */
    private validateAndFixNode(node: any, errors: string[], warnings: string[], fixes: string[]): void {
        // 确保节点有必要的字段
        if (!node.id) {
            errors.push(`节点缺少 id`)
            return
        }

        if (!node.data) {
            errors.push(`节点 ${node.id} 缺少 data`)
            return
        }

        // 修复节点类型
        if (!node.type) {
            node.type = 'customNode'
            fixes.push(`为节点 ${node.id} 添加 type: customNode`)
        }

        // 修复位置
        if (!node.position) {
            node.position = { x: 400, y: 400 }
            fixes.push(`为节点 ${node.id} 添加默认位置`)
        }

        // 确保 data 字段完整
        if (!node.data.label) {
            node.data.label = node.data.name || node.data.type || 'Unknown'
            fixes.push(`为节点 ${node.id} 添加 label`)
        }

        // 确保有 inputs 对象
        if (!node.data.inputs) {
            node.data.inputs = {}
            fixes.push(`为节点 ${node.id} 添加 inputs 对象`)
        }

        // 确保有 outputs 对象
        if (!node.data.outputs) {
            node.data.outputs = {}
            fixes.push(`为节点 ${node.id} 添加 outputs 对象`)
        }

        // 特殊节点类型的验证
        this.validateSpecialNode(node, warnings, fixes)
    }

    /**
     * 验证特殊节点类型
     */
    private validateSpecialNode(node: any, warnings: string[], fixes: string[]): void {
        const nodeType = node.data.type || node.data.name

        // ChatModel 节点需要 credential
        if (nodeType?.includes('Chat') || nodeType?.includes('LLM')) {
            // 确保有 credential 参数定义
            if (!node.data.inputParams) {
                node.data.inputParams = []
            }

            const hasCredentialParam = node.data.inputParams.some(
                (param: any) => param.name === 'credential' && param.type === 'credential'
            )

            if (!hasCredentialParam) {
                // 添加 credential 参数定义
                node.data.inputParams.unshift({
                    label: 'Connect Credential',
                    name: 'credential',
                    type: 'credential',
                    credentialNames: ['deepseekApi'],
                    optional: false
                })
                fixes.push(`为节点 ${node.id} 添加 credential 参数定义`)
            }

            // 确保有 temperature 参数
            if (node.data.inputs && node.data.inputs.temperature === undefined) {
                node.data.inputs.temperature = 0.7
                fixes.push(`为节点 ${node.id} 设置默认 temperature: 0.7`)
            }
        }

        // ConversationChain 需要连接到 ChatModel 和 Memory
        if (nodeType === 'ConversationChain') {
            if (!node.data.inputAnchors || node.data.inputAnchors.length === 0) {
                node.data.inputAnchors = [
                    {
                        label: 'Chat Model',
                        name: 'model',
                        type: 'BaseChatModel',
                        id: `${node.id}-input-model-BaseChatModel`
                    },
                    {
                        label: 'Memory',
                        name: 'memory',
                        type: 'BaseMemory',
                        optional: true,
                        id: `${node.id}-input-memory-BaseMemory`
                    }
                ]
                fixes.push(`为节点 ${node.id} 添加输入锚点`)
            }
        }

        // Memory 节点
        if (nodeType?.includes('Memory')) {
            if (node.data.inputs) {
                if (!node.data.inputs.memoryKey) {
                    node.data.inputs.memoryKey = 'chat_history'
                    fixes.push(`为节点 ${node.id} 设置默认 memoryKey`)
                }
            }
        }
    }

    /**
     * 验证连接
     */
    private validateEdges(workflow: WorkflowData, errors: string[], warnings: string[]): void {
        const nodeIds = new Set(workflow.nodes.map((n) => n.id))

        for (const edge of workflow.edges) {
            // 验证源节点存在
            if (!nodeIds.has(edge.source)) {
                errors.push(`连接 ${edge.id} 的源节点 ${edge.source} 不存在`)
            }

            // 验证目标节点存在
            if (!nodeIds.has(edge.target)) {
                errors.push(`连接 ${edge.id} 的目标节点 ${edge.target} 不存在`)
            }

            // 确保有 type
            if (!edge.type) {
                edge.type = 'buttonedge'
                // 不记录为 fix，因为这是自动添加的
            }

            // 确保有 id
            if (!edge.id) {
                edge.id = `${edge.source}-${edge.target}`
            }
        }
    }

    /**
     * 确保有输出节点
     */
    private ensureOutputNode(workflow: WorkflowData, warnings: string[], fixes: string[]): boolean {
        // 查找可能的输出节点
        const outputNodeTypes = ['ConversationChain', 'LLMChain', 'Chain', 'Agent']

        const hasOutputNode = workflow.nodes.some((node) => {
            const nodeType = node.data.type || node.data.name
            return outputNodeTypes.some((type) => nodeType?.includes(type))
        })

        if (!hasOutputNode) {
            warnings.push('工作流可能缺少输出节点（Chain 或 Agent）')
            return false
        }

        return true
    }

    /**
     * 生成验证报告
     */
    generateReport(result: ValidationResult): string {
        let report = '# 工作流验证报告\n\n'

        if (result.valid) {
            report += '✅ **验证通过**\n\n'
        } else {
            report += '❌ **验证失败**\n\n'
        }

        if (result.errors.length > 0) {
            report += '## 错误\n\n'
            result.errors.forEach((error) => {
                report += `- ❌ ${error}\n`
            })
            report += '\n'
        }

        if (result.warnings.length > 0) {
            report += '## 警告\n\n'
            result.warnings.forEach((warning) => {
                report += `- ⚠️ ${warning}\n`
            })
            report += '\n'
        }

        if (result.fixes.length > 0) {
            report += '## 自动修复\n\n'
            result.fixes.forEach((fix) => {
                report += `- 🔧 ${fix}\n`
            })
            report += '\n'
        }

        return report
    }
}
