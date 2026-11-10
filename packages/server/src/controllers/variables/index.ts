import { Request, Response, NextFunction } from 'express'
import variablesService from '../../services/variables'
import { Variable } from '../../database/entities/Variable'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

const createVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: variablesController.createVariable - body not provided!`
            )
        }
        const body = req.body
        const newVariable = new Variable()
        Object.assign(newVariable, body)
        const userId = req.user?.userId
        const apiResponse = await variablesService.createVariable(newVariable, userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: variablesController.deleteVariable - id not provided!')
        }
        const userId = req.user?.userId
        const isAdmin = req.user?.role === 'admin'
        const apiResponse = await variablesService.deleteVariable(req.params.id, isAdmin ? undefined : userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllVariables = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const isAdmin = req.user?.role === 'admin'
        const apiResponse = await variablesService.getAllVariables(isAdmin ? undefined : userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateVariable = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: variablesController.updateVariable - id not provided!')
        }
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: variablesController.updateVariable - body not provided!'
            )
        }
        const userId = req.user?.userId
        const isAdmin = req.user?.role === 'admin'
        const variable = await variablesService.getVariableById(req.params.id, isAdmin ? undefined : userId)
        if (!variable) {
            return res.status(404).send(`Variable ${req.params.id} not found in the database`)
        }
        const body = req.body
        const updatedVariable = new Variable()
        Object.assign(updatedVariable, body)
        const apiResponse = await variablesService.updateVariable(variable, updatedVariable, isAdmin ? undefined : userId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createVariable,
    deleteVariable,
    getAllVariables,
    updateVariable
}
