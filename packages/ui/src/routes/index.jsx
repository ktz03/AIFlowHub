import { useRoutes } from 'react-router-dom'

// routes
import MainRoutes from './MainRoutes'
import CanvasRoutes from './CanvasRoutes'
import ChatbotRoutes from './ChatbotRoutes'
import AuthRoutes from './AuthRoutes'
import config from '@/config'

// ==============================|| ROUTING RENDER ||============================== //

export default function ThemeRoutes() {
    return useRoutes([AuthRoutes, MainRoutes, CanvasRoutes, ChatbotRoutes], config.basename)
}
