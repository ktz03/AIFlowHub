import { Request, Response, NextFunction } from 'express'
import credentialsService from '../../services/credentials'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

const createCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.createCredential - body not provided!`
            )
        }
        // 获取当前用户ID
        const userId = req.user?.userId
        const apiResponse = await credentialsService.createCredential(req.body, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.deleteCredentials - id not provided!`
            )
        }
        // 获取当前用户ID（所有用户包括管理员都只能删除自己的凭证）
        const userId = req.user?.userId
        const apiResponse = await credentialsService.deleteCredentials(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 获取当前用户ID（所有用户包括管理员都只能看到自己的凭证）
        const userId = req.user?.userId
        const apiResponse = await credentialsService.getAllCredentials(req.query.credentialName, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getCredentialById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.getCredentialById - id not provided!`
            )
        }
        // 获取当前用户ID（所有用户包括管理员都只能访问自己的凭证）
        const userId = req.user?.userId
        const apiResponse = await credentialsService.getCredentialById(req.params.id, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.updateCredential - id not provided!`
            )
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.updateCredential - body not provided!`
            )
        }
        // 获取当前用户ID（所有用户包括管理员都只能更新自己的凭证）
        const userId = req.user?.userId
        const apiResponse = await credentialsService.updateCredential(req.params.id, req.body, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential
}
