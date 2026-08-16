import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import authService from '../../services/auth'
import { UserRole, UserStatus } from '../../database/entities/User'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, email, password } = req.body
        const result = await authService.register({ username, email, password })
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: '注册成功',
            data: result
        })
    } catch (error) {
        next(error)
    }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, username, password } = req.body
        const result = await authService.login({ email, username, password })
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '登录成功',
            data: result
        })
    } catch (error) {
        next(error)
    }
}

const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body
        const tokens = await authService.refreshToken(refreshToken)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Token 刷新成功',
            data: { tokens }
        })
    } catch (error) {
        next(error)
    }
}

const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }
        await authService.logout(req.user.userId)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '退出成功'
        })
    } catch (error) {
        next(error)
    }
}

const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }
        const user = await authService.getCurrentUser(req.user.userId)
        return res.status(StatusCodes.OK).json({
            success: true,
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

const updateCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }
        const { username } = req.body
        const user = await authService.updateUser(req.user.userId, { username })
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '更新成功',
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '未登录')
        }
        const { oldPassword, newPassword } = req.body
        await authService.changePassword(req.user.userId, oldPassword, newPassword)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '密码修改成功，请重新登录'
        })
    } catch (error) {
        next(error)
    }
}

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await authService.getAllUsers()
        return res.status(StatusCodes.OK).json({
            success: true,
            data: { users, total: users.length }
        })
    } catch (error) {
        next(error)
    }
}

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const user = await authService.getCurrentUser(id)
        return res.status(StatusCodes.OK).json({
            success: true,
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { role } = req.body
        if (!Object.values(UserRole).includes(role)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '无效的角色')
        }
        const user = await authService.updateUserRole(id, role)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '角色更新成功',
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { status } = req.body
        if (!Object.values(UserStatus).includes(status)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '无效的状态')
        }
        const user = await authService.updateUserStatus(id, status)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '状态更新成功',
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

const updateUserQuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { quotaLimit } = req.body
        if (typeof quotaLimit !== 'number' || quotaLimit < 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '配额必须是非负数')
        }
        const user = await authService.updateUserQuota(id, quotaLimit)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '配额更新成功',
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        if (req.user && req.user.userId === id) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '不能删除自己的账户')
        }
        await authService.deleteUser(id)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: '用户删除成功'
        })
    } catch (error) {
        next(error)
    }
}

export default {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser,
    updateCurrentUser,
    changePassword,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    updateUserQuota,
    deleteUser
}
