/**
 * 工作流布局引擎
 * 自动计算节点位置，避免重叠，生成美观的布局
 */

export interface NodePosition {
    x: number
    y: number
}

export interface LayoutNode {
    id: string
    width?: number
    height?: number
    position?: NodePosition
}

export interface LayoutEdge {
    source: string
    target: string
}

export interface LayoutConfig {
    nodeWidth: number // 节点宽度
    nodeHeight: number // 节点高度
    horizontalSpacing: number // 水平间距
    verticalSpacing: number // 垂直间距
    startX: number // 起始 X 坐标
    startY: number // 起始 Y 坐标
}

// 默认布局配置
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    nodeWidth: 300,
    nodeHeight: 150,
    horizontalSpacing: 200,
    verticalSpacing: 100,
    startX: 100,
    startY: 100
}

/**
 * 布局引擎类
 */
export class LayoutEngine {
    private config: LayoutConfig

    constructor(config?: Partial<LayoutConfig>) {
        this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config }
    }

    /**
     * 自动布局节点
     * 使用层次布局算法（Hierarchical Layout）
     */
    autoLayout(nodes: LayoutNode[], edges: LayoutEdge[]): Map<string, NodePosition> {
        // 1. 构建图结构
        const graph = this.buildGraph(nodes, edges)

        // 2. 拓扑排序，确定层级
        const layers = this.topologicalSort(graph, nodes)

        // 3. 计算每个节点的位置
        const positions = this.calculatePositions(layers)

        return positions
    }

    /**
     * 构建图结构
     */
    private buildGraph(nodes: LayoutNode[], edges: LayoutEdge[]): Map<string, Set<string>> {
        const graph = new Map<string, Set<string>>()

        // 初始化所有节点
        nodes.forEach((node) => {
            if (!graph.has(node.id)) {
                graph.set(node.id, new Set())
            }
        })

        // 添加边
        edges.forEach((edge) => {
            const targets = graph.get(edge.source)
            if (targets) {
                targets.add(edge.target)
            }
        })

        return graph
    }

    /**
     * 拓扑排序，将节点分层
     */
    private topologicalSort(graph: Map<string, Set<string>>, nodes: LayoutNode[]): string[][] {
        const layers: string[][] = []
        const visited = new Set<string>()
        const inDegree = new Map<string, number>()

        // 计算入度
        nodes.forEach((node) => {
            inDegree.set(node.id, 0)
        })

        graph.forEach((targets) => {
            targets.forEach((target) => {
                inDegree.set(target, (inDegree.get(target) || 0) + 1)
            })
        })

        // 分层处理
        while (visited.size < nodes.length) {
            const currentLayer: string[] = []

            // 找出当前层的节点（入度为 0 的节点）
            nodes.forEach((node) => {
                if (!visited.has(node.id) && inDegree.get(node.id) === 0) {
                    currentLayer.push(node.id)
                    visited.add(node.id)
                }
            })

            // 如果没有找到入度为 0 的节点，说明有环或孤立节点
            if (currentLayer.length === 0) {
                // 添加剩余的孤立节点
                nodes.forEach((node) => {
                    if (!visited.has(node.id)) {
                        currentLayer.push(node.id)
                        visited.add(node.id)
                    }
                })
            }

            if (currentLayer.length > 0) {
                layers.push(currentLayer)

                // 更新入度
                currentLayer.forEach((nodeId) => {
                    const targets = graph.get(nodeId)
                    if (targets) {
                        targets.forEach((target) => {
                            inDegree.set(target, (inDegree.get(target) || 0) - 1)
                        })
                    }
                })
            }
        }

        return layers
    }

    /**
     * 计算每个节点的位置
     */
    private calculatePositions(layers: string[][]): Map<string, NodePosition> {
        const positions = new Map<string, NodePosition>()
        const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, startX, startY } = this.config

        layers.forEach((layer, layerIndex) => {
            const layerX = startX + layerIndex * (nodeWidth + horizontalSpacing)

            // 计算该层的总高度
            const layerHeight = layer.length * nodeHeight + (layer.length - 1) * verticalSpacing

            // 居中对齐
            const layerStartY = startY - layerHeight / 2

            layer.forEach((nodeId, nodeIndex) => {
                const y = layerStartY + nodeIndex * (nodeHeight + verticalSpacing) + layerHeight / 2

                positions.set(nodeId, {
                    x: layerX,
                    y: y
                })
            })
        })

        return positions
    }

    /**
     * 网格布局（备用方案）
     * 适用于没有明确层次关系的节点
     */
    gridLayout(nodes: LayoutNode[], columns: number = 3): Map<string, NodePosition> {
        const positions = new Map<string, NodePosition>()
        const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, startX, startY } = this.config

        nodes.forEach((node, index) => {
            const row = Math.floor(index / columns)
            const col = index % columns

            positions.set(node.id, {
                x: startX + col * (nodeWidth + horizontalSpacing),
                y: startY + row * (nodeHeight + verticalSpacing)
            })
        })

        return positions
    }

    /**
     * 力导向布局（高级方案）
     * 使用物理模拟算法，节点之间相互排斥，连接的节点相互吸引
     */
    forceDirectedLayout(nodes: LayoutNode[], edges: LayoutEdge[], iterations: number = 100): Map<string, NodePosition> {
        const positions = new Map<string, NodePosition>()

        // 初始化随机位置
        nodes.forEach((node) => {
            positions.set(node.id, {
                x: this.config.startX + Math.random() * 500,
                y: this.config.startY + Math.random() * 500
            })
        })

        // 力导向参数
        const repulsionForce = 5000
        const attractionForce = 0.01
        const damping = 0.9

        // 迭代计算
        for (let iter = 0; iter < iterations; iter++) {
            const forces = new Map<string, { x: number; y: number }>()

            // 初始化力
            nodes.forEach((node) => {
                forces.set(node.id, { x: 0, y: 0 })
            })

            // 计算排斥力（所有节点之间）
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i]
                    const node2 = nodes[j]
                    const pos1 = positions.get(node1.id)!
                    const pos2 = positions.get(node2.id)!

                    const dx = pos2.x - pos1.x
                    const dy = pos2.y - pos1.y
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1

                    const force = repulsionForce / (distance * distance)
                    const fx = (force * dx) / distance
                    const fy = (force * dy) / distance

                    const force1 = forces.get(node1.id)!
                    const force2 = forces.get(node2.id)!

                    force1.x -= fx
                    force1.y -= fy
                    force2.x += fx
                    force2.y += fy
                }
            }

            // 计算吸引力（连接的节点之间）
            edges.forEach((edge) => {
                const pos1 = positions.get(edge.source)
                const pos2 = positions.get(edge.target)

                if (pos1 && pos2) {
                    const dx = pos2.x - pos1.x
                    const dy = pos2.y - pos1.y
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1

                    const force = attractionForce * distance
                    const fx = (force * dx) / distance
                    const fy = (force * dy) / distance

                    const force1 = forces.get(edge.source)!
                    const force2 = forces.get(edge.target)!

                    force1.x += fx
                    force1.y += fy
                    force2.x -= fx
                    force2.y -= fy
                }
            })

            // 应用力并更新位置
            nodes.forEach((node) => {
                const pos = positions.get(node.id)!
                const force = forces.get(node.id)!

                pos.x += force.x * damping
                pos.y += force.y * damping
            })
        }

        return positions
    }

    /**
     * 检测并解决重叠
     */
    resolveOverlaps(positions: Map<string, NodePosition>): Map<string, NodePosition> {
        const { nodeWidth, nodeHeight } = this.config
        const resolvedPositions = new Map(positions)
        const nodes = Array.from(positions.keys())

        let hasOverlap = true
        let iterations = 0
        const maxIterations = 50

        while (hasOverlap && iterations < maxIterations) {
            hasOverlap = false
            iterations++

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i]
                    const node2 = nodes[j]
                    const pos1 = resolvedPositions.get(node1)!
                    const pos2 = resolvedPositions.get(node2)!

                    // 检查是否重叠
                    const dx = Math.abs(pos2.x - pos1.x)
                    const dy = Math.abs(pos2.y - pos1.y)

                    if (dx < nodeWidth && dy < nodeHeight) {
                        hasOverlap = true

                        // 计算移动方向
                        const moveX = (nodeWidth - dx) / 2 + 10
                        const moveY = (nodeHeight - dy) / 2 + 10

                        // 移动节点
                        if (pos2.x > pos1.x) {
                            pos2.x += moveX
                        } else {
                            pos2.x -= moveX
                        }

                        if (pos2.y > pos1.y) {
                            pos2.y += moveY
                        } else {
                            pos2.y -= moveY
                        }
                    }
                }
            }
        }

        return resolvedPositions
    }
}

/**
 * 便捷函数：自动布局工作流
 */
export function autoLayoutWorkflow(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    layoutType: 'hierarchical' | 'grid' | 'force' = 'hierarchical',
    config?: Partial<LayoutConfig>
): Map<string, NodePosition> {
    const engine = new LayoutEngine(config)

    let positions: Map<string, NodePosition>

    switch (layoutType) {
        case 'grid':
            positions = engine.gridLayout(nodes)
            break
        case 'force':
            positions = engine.forceDirectedLayout(nodes, edges)
            break
        case 'hierarchical':
        default:
            positions = engine.autoLayout(nodes, edges)
            break
    }

    // 解决重叠
    positions = engine.resolveOverlaps(positions)

    return positions
}
