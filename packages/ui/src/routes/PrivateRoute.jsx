import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * 路由守卫组件
 * 保护需要登录才能访问的页面
 */
const PrivateRoute = ({ children }) => {
    const location = useLocation()
    const { isAuthenticated } = useSelector((state) => state.auth)
    
    // 检查 localStorage 中是否有 token（用于页面刷新后的状态恢复）
    const hasToken = !!localStorage.getItem('accessToken')
    
    // 如果未登录且没有 token，重定向到登录页
    if (!isAuthenticated && !hasToken) {
        // 保存当前路径，登录后可以跳转回来
        return <Navigate to="/auth/login" state={{ from: location }} replace />
    }
    
    return children
}

export default PrivateRoute
