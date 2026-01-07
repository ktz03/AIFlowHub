import { lazy } from 'react'
import Loadable from '@/ui-component/loading/Loadable'

// 懒加载认证页面
const Login = Loadable(lazy(() => import('@/views/auth/Login')))
const Register = Loadable(lazy(() => import('@/views/auth/Register')))

// ==============================|| AUTH ROUTING ||============================== //

const AuthRoutes = {
    path: '/auth',
    children: [
        {
            path: 'login',
            element: <Login />
        },
        {
            path: 'register',
            element: <Register />
        }
    ]
}

export default AuthRoutes
