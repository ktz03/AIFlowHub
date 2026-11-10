import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import apiKeyService from '../../services/apikey'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { RateLimiterManager } from '../../utils/rateLimit'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { ChatflowType } from '../../Interface'
import chatflowsService from '../../services/chatflows'

const checkIfChatflowIsValidForStreaming = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.checkIfChatflowIsValidForStreaming - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.checkIfChatflowIsValidForStreaming(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const checkIfChatflowIsValidForUploads = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.checkIfChatflowIsValidForUploads - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.checkIfChatflowIsValidForUploads(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.deleteChatflow - id not provided!`)
        }
        // 获取当前用户ID（如果已登录）
        const userId = req.user?.userId
        const apiResponse = await chatflowsService.deleteChatflow(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllChatflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 获取当前用户ID（所有用户包括管理员都只能看到自己的工作流）
        const userId = req.user?.userId
        const apiResponse = await chatflowsService.getAllChatflows(req.query?.type as ChatflowType, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Get specific chatflow via api key
const getChatflowByApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.getChatflowByApiKey - apikey not provided!`
            )
        }
        const apikey = await apiKeyService.getApiKey(req.params.apikey)
        if (!apikey) {
            return res.status(401).send('Unauthorized')
        }
        const apiResponse = await chatflowsService.getChatflowByApiKey(apikey.id, req.query.keyonly)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getChatflowById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getChatflowById - id not provided!`)
        }
        // 获取当前用户ID（所有用户包括管理员都只能访问自己的工作流）
        const userId = req.user?.userId
        const apiResponse = await chatflowsService.getChatflowById(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const saveChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.saveChatflow - body not provided!`)
        }
        const body = req.body
        const newChatFlow = new ChatFlow()
        Object.assign(newChatFlow, body)

        // 自动设置当前用户为 chatflow 的所有者
        if (req.user?.userId) {
            newChatFlow.userId = req.user.userId
        }

        const apiResponse = await chatflowsService.saveChatflow(newChatFlow)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const importChatflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chatflows: Partial<ChatFlow>[] = req.body.Chatflows
        const apiResponse = await chatflowsService.importChatflows(chatflows)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.updateChatflow - id not provided!`)
        }
        // 获取当前用户ID（所有用户包括管理员都只能更新自己的工作流）
        const userId = req.user?.userId
        const chatflow = await chatflowsService.getChatflowById(req.params.id, userId)
        if (!chatflow) {
            return res.status(404).send(`Chatflow ${req.params.id} not found`)
        }

        const body = req.body
        const updateChatFlow = new ChatFlow()
        Object.assign(updateChatFlow, body)

        updateChatFlow.id = chatflow.id
        const rateLimiterManager = RateLimiterManager.getInstance()
        await rateLimiterManager.updateRateLimiter(updateChatFlow)

        const apiResponse = await chatflowsService.updateChatflow(chatflow, updateChatFlow)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getSinglePublicChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.getSinglePublicChatflow - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.getSinglePublicChatflow(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getSinglePublicChatbotConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.getSinglePublicChatbotConfig - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.getSinglePublicChatbotConfig(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// 获取无主的 chatflows（管理员专用）
const getOrphanedChatflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否为管理员
        if (req.user?.role !== 'admin') {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Admin access required')
        }
        const apiResponse = await chatflowsService.getOrphanedChatflows(req.query?.type as ChatflowType)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// 分配 chatflow 所有者（管理员专用）
const assignChatflowOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否为管理员
        if (req.user?.role !== 'admin') {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Admin access required')
        }

        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Chatflow id not provided!')
        }

        const { userId } = req.body
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'userId not provided!')
        }

        const apiResponse = await chatflowsService.assignChatflowOwner(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// 批量分配 chatflow 所有者（管理员专用）
const batchAssignChatflowOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 检查是否为管理员
        if (req.user?.role !== 'admin') {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Admin access required')
        }

        const { chatflowIds, userId } = req.body
        if (!chatflowIds || !Array.isArray(chatflowIds) || chatflowIds.length === 0) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'chatflowIds array not provided!')
        }
        if (!userId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'userId not provided!')
        }

        const apiResponse = await chatflowsService.batchAssignChatflowOwner(chatflowIds, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    importChatflows,
    updateChatflow,
    getSinglePublicChatflow,
    getSinglePublicChatbotConfig,
    getOrphanedChatflows,
    assignChatflowOwner,
    batchAssignChatflowOwner
}
