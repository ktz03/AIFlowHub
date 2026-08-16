import { StatusCodes } from 'http-status-codes'
import { User, UserRole, UserStatus } from '../../database/entities/User'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'
import {
    hashPassword,
    verifyPassword,
    generateTokenPair,
    verifyToken,
    isValidEmail,
    isValidPassword,
    isValidUsername,
    TokenPair
} from '../../utils/auth'

interface RegisterInput {
    username: string
    email: string
    password: string
}

interface LoginInput {
    email?: string
    username?: string
    password: string
}

interface AuthResponse {
    user: Partial<User>
    tokens: TokenPair
}

const sanitizeUser = (user: User): Partial<User> => {
    const { password, refreshToken, resetPasswordToken, emailVerificationToken, ...safeUser } = user
    return safeUser
}

const register = async (input: RegisterInput): Promise<AuthResponse> => {
    try {
        const { username, email, password } = input
        const usernameValidation = isValidUsername(username)
        if (!usernameValidation.valid) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, usernameValidation.message)
        }
        if (!isValidEmail(email)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '邮箱格式不正确')
        }
        const passwordValidation = isValidPassword(password)
        if (!passwordValidation.valid) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, passwordValidation.message)
        }
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const existingUsername = await userRepository.findOne({ where: { username } })
        if (existingUsername) {
            throw new InternalFlowiseError(StatusCodes.CONFLICT, '用户名已被使用')
        }
        const existingEmail = await userRepository.findOne({ where: { email } })
        if (existingEmail) {
            throw new InternalFlowiseError(StatusCodes.CONFLICT, '邮箱已被注册')
        }

        const hashedPassword = await hashPassword(password)
        const user = userRepository.create({
            username,
            email,
            password: hashedPassword,
            role: UserRole.USER,
            status: UserStatus.ACTIVE
        })
        await userRepository.save(user)
        const tokens = generateTokenPair(user)
        user.refreshToken = tokens.refreshToken
        await userRepository.save(user)
        return { user: sanitizeUser(user), tokens }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.register - ${getErrorMessage(error)}`)
    }
}

const login = async (input: LoginInput): Promise<AuthResponse> => {
    try {
        const { email, username, password } = input
        const loginId = (email || username || '').trim()
        if (!loginId || !password) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '请输入邮箱/用户名和密码')
        }
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        // Support both email login and username login to reduce 401 caused by identifier mismatch.
        const user = await userRepository
            .createQueryBuilder('user')
            .where('LOWER(user.email) = LOWER(:loginId)', { loginId })
            .orWhere('LOWER(user.username) = LOWER(:loginId)', { loginId })
            .getOne()
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '账号或密码错误')
        }
        if (user.status !== UserStatus.ACTIVE) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, '账户已被禁用')
        }
        const isPasswordValid = await verifyPassword(password, user.password)
        if (!isPasswordValid) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '账号或密码错误')
        }
        const tokens = generateTokenPair(user)
        user.refreshToken = tokens.refreshToken
        user.lastLoginAt = new Date()
        await userRepository.save(user)
        return { user: sanitizeUser(user), tokens }
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.login - ${getErrorMessage(error)}`)
    }
}

const refreshToken = async (token: string): Promise<TokenPair> => {
    try {
        if (!token) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, '缺少 Refresh Token')
        }
        const payload = verifyToken(token)
        if (!payload || payload.type !== 'refresh') {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Refresh Token 无效或已过期')
        }
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: payload.userId } })
        if (!user || user.refreshToken !== token) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Refresh Token 无效')
        }
        const tokens = generateTokenPair(user)
        user.refreshToken = tokens.refreshToken
        await userRepository.save(user)
        return tokens
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.refreshToken - ${getErrorMessage(error)}`)
    }
}

const logout = async (userId: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (user) {
            user.refreshToken = ''
            await userRepository.save(user)
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.logout - ${getErrorMessage(error)}`)
    }
}

const getCurrentUser = async (userId: string): Promise<Partial<User>> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        return sanitizeUser(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.getCurrentUser - ${getErrorMessage(error)}`)
    }
}

const updateUser = async (userId: string, updates: Partial<User>): Promise<Partial<User>> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        if (updates.username) {
            const validation = isValidUsername(updates.username)
            if (!validation.valid) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, validation.message)
            }
            const existing = await userRepository.findOne({ where: { username: updates.username } })
            if (existing && existing.id !== userId) {
                throw new InternalFlowiseError(StatusCodes.CONFLICT, '用户名已被使用')
            }
            user.username = updates.username
        }
        await userRepository.save(user)
        return sanitizeUser(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.updateUser - ${getErrorMessage(error)}`)
    }
}

const changePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        const isOldPasswordValid = await verifyPassword(oldPassword, user.password)
        if (!isOldPasswordValid) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, '原密码错误')
        }
        const validation = isValidPassword(newPassword)
        if (!validation.valid) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, validation.message)
        }
        user.password = await hashPassword(newPassword)
        user.refreshToken = ''
        await userRepository.save(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.changePassword - ${getErrorMessage(error)}`)
    }
}

const getAllUsers = async (): Promise<Partial<User>[]> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const users = await userRepository.find({ order: { createdAt: 'DESC' } })
        return users.map(sanitizeUser)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.getAllUsers - ${getErrorMessage(error)}`)
    }
}

const updateUserRole = async (userId: string, role: UserRole): Promise<Partial<User>> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        user.role = role
        await userRepository.save(user)
        return sanitizeUser(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.updateUserRole - ${getErrorMessage(error)}`)
    }
}

const updateUserStatus = async (userId: string, status: UserStatus): Promise<Partial<User>> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        user.status = status
        await userRepository.save(user)
        return sanitizeUser(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.updateUserStatus - ${getErrorMessage(error)}`)
    }
}

const updateUserQuota = async (userId: string, quotaLimit: number): Promise<Partial<User>> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        user.quotaLimit = quotaLimit
        await userRepository.save(user)
        return sanitizeUser(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.updateUserQuota - ${getErrorMessage(error)}`)
    }
}

const deleteUser = async (userId: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const userRepository = appServer.AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, '用户不存在')
        }
        await userRepository.remove(user)
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.deleteUser - ${getErrorMessage(error)}`)
    }
}

export default {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser,
    updateUser,
    changePassword,
    getAllUsers,
    updateUserRole,
    updateUserStatus,
    updateUserQuota,
    deleteUser
}
