import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

// routing
import Routes from '@/routes'

// defaultTheme
import themes from '@/themes'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'

// API
import authApi from '@/api/auth'

// Store
import { SET_USER } from '@/store/actions'

// ==============================|| APP ||============================== //

const App = () => {
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    // 初始化用户会话
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('accessToken')
            if (token) {
                try {
                    // 从服务器获取最新的用户信息
                    const response = await authApi.getCurrentUser()
                    if (response.data.success) {
                        const user = response.data.data.user // 注意：后端返回的是 { user: {...} }
                        // 更新 localStorage
                        localStorage.setItem('user', JSON.stringify(user))
                        // 更新 Redux store
                        dispatch({ type: SET_USER, user })
                        console.log('[App] 用户会话已恢复:', user)
                    }
                } catch (error) {
                    console.error('[App] 恢复用户会话失败:', error)
                    // 如果 token 无效，清除本地存储
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('user')
                }
            }
        }

        initializeAuth()
    }, [dispatch])

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

export default App
