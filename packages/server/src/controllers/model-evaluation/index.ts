import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import modelEvaluationService from '../../services/model-evaluation'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

// 执行评测
const runEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }

        const { testInput, chatflowIds, title, systemPrompt } = req.body

        if (!testInput || !testInput.trim()) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '测试输入不能为空')
        }

        if (!chatflowIds || !Array.isArray(chatflowIds) || chatflowIds.length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请至少选择一个工作流进行评测')
        }

        if (chatflowIds.length > 10) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '单次评测最多支持10个工作流')
        }

        const result = await modelEvaluationService.runEvaluation({
            testInput,
            chatflowIds,
            userId,
            title,
            systemPrompt
        })

        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

// 获取评测历史
const getEvaluationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }

        const { page, limit } = req.query
        const result = await modelEvaluationService.getEvaluationHistory(
            userId,
            page ? parseInt(page as string) : 1,
            limit ? parseInt(limit as string) : 20
        )

        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 获取评测详情
const getEvaluationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }

        const { id } = req.params
        const result = await modelEvaluationService.getEvaluationById(id, userId)

        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 删除评测记录
const deleteEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }

        const { id } = req.params
        const result = await modelEvaluationService.deleteEvaluation(id, userId)

        return res.json(result)
    } catch (error) {
        next(error)
    }
}

// 获取可用工作流列表
const getAvailableChatflows = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const chatflows = await modelEvaluationService.getAvailableChatflows()
        return res.json(chatflows)
    } catch (error) {
        next(error)
    }
}

// 获取预设评测场景
const getEvaluationScenarios = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const scenarios = modelEvaluationService.getEvaluationScenarios()
        return res.json(scenarios)
    } catch (error) {
        next(error)
    }
}

// 批量评测
const runBatchEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.userId
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '请先登录')
        }

        const { chatflowIds, scenarioId } = req.body

        if (!chatflowIds || !Array.isArray(chatflowIds) || chatflowIds.length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请至少选择一个工作流进行评测')
        }

        if (!scenarioId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请选择评测场景')
        }

        const results = await modelEvaluationService.runBatchEvaluation(userId, chatflowIds, scenarioId)

        return res.status(StatusCodes.OK).json(results)
    } catch (error) {
        next(error)
    }
}

export default {
    runEvaluation,
    getEvaluationHistory,
    getEvaluationById,
    deleteEvaluation,
    getAvailableChatflows,
    getEvaluationScenarios,
    runBatchEvaluation
}
