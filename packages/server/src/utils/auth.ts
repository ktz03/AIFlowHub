import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User, UserRole } from '../database/entities/User'

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'flowise-jwt-secret-key-change-in-production'
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m'
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d'

export interface JwtPayload {
    userId: string
    email: string
    role: UserRole
    type: 'access' | 'refresh'
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
}

/**
 * 密码加密
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(12)
    return bcrypt.hash(password, salt)
}

/**
 * 密码验证
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword)
}

/**
 * 生成 Access Token
 */
export const generateAccessToken = (user: User): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES })
}

/**
 * 生成 Refresh Token
 */
export const generateRefreshToken = (user: User): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh'
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES })
}

/**
 * 生成 Token 对
 */
export const generateTokenPair = (user: User): TokenPair => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    }
}

/**
 * 验证 Token
 */
export const verifyToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
        return decoded
    } catch (error) {
        return null
    }
}

/**
 * 生成随机 Token（用于密码重置、邮箱验证等）
 */
export const generateRandomToken = (): string => {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * 生成密码重置 Token 的哈希值
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export const isValidPassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
        return { valid: false, message: '密码长度至少为6位' }
    }
    if (password.length > 50) {
        return { valid: false, message: '密码长度不能超过50位' }
    }
    return { valid: true, message: '' }
}

/**
 * 验证用户名格式
 */
export const isValidUsername = (username: string): { valid: boolean; message: string } => {
    if (username.length < 3) {
        return { valid: false, message: '用户名长度至少为3位' }
    }
    if (username.length > 50) {
        return { valid: false, message: '用户名长度不能超过50位' }
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
        return { valid: false, message: '用户名只能包含字母、数字和下划线' }
    }
    return { valid: true, message: '' }
}
