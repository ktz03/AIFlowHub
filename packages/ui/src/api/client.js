import axios from 'axios'
import { baseURL } from '@/store/constant'

const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    }
})

// 请求拦截器 - 添加认证信息
apiClient.interceptors.request.use(function (config) {
    // 优先使用 JWT Token
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
        return config
    }

    // 兼容旧的 Basic Auth
    const username = localStorage.getItem('username')
    const password = localStorage.getItem('password')
    if (username && password) {
        config.auth = {
            username,
            password
        }
    }

    return config
})

// 响应拦截器 - 处理 Token 过期
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // 如果是 401 错误且不是刷新 Token 请求
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
                try {
                    const response = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, {
                        refreshToken
                    })

                    if (response.data.success) {
                        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
                        localStorage.setItem('accessToken', accessToken)
                        localStorage.setItem('refreshToken', newRefreshToken)

                        // 重试原请求
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`
                        return apiClient(originalRequest)
                    }
                } catch (refreshError) {
                    // 刷新失败，清除 Token 并跳转登录
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    window.location.href = '/login'
                }
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
