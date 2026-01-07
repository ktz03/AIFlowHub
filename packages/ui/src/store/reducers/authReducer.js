import { SET_USER, CLEAR_USER } from '../actions'

// 从 localStorage 恢复用户状态
const getUserFromStorage = () => {
    try {
        const userStr = localStorage.getItem('user')
        const token = localStorage.getItem('accessToken')
        if (userStr && token) {
            return JSON.parse(userStr)
        }
    } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
    }
    return null
}

const storedUser = getUserFromStorage()

const initialState = {
    user: storedUser,
    isAuthenticated: !!storedUser
}

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_USER:
            return {
                ...state,
                user: action.user,
                isAuthenticated: !!action.user
            }
        case CLEAR_USER:
            return {
                ...state,
                user: null,
                isAuthenticated: false
            }
        default:
            return state
    }
}

export default authReducer
