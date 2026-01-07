import { SET_USER, CLEAR_USER } from '../actions'

const initialState = {
    user: null,
    isAuthenticated: false
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
