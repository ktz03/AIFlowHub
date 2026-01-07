import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Avatar,
    Box,
    Button,
    ButtonBase,
    ClickAwayListener,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Popper,
    Typography,
    Chip
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'

// assets
import { IconUser, IconLogout, IconSettings, IconUserCircle, IconLogin, IconUserPlus } from '@tabler/icons-react'

// store
import { CLEAR_USER } from '@/store/actions'

// API
import authApi from '@/api/auth'

const UserSection = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { t } = useTranslation()

    const { user, isAuthenticated } = useSelector((state) => state.auth)
    const customization = useSelector((state) => state.customization)

    const [open, setOpen] = useState(false)
    const anchorRef = useRef(null)
    const prevOpen = useRef(open)

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen)
    }

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return
        }
        setOpen(false)
    }

    const handleLogout = async () => {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // 清除本地存储
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            // 清除 Redux store
            dispatch({ type: CLEAR_USER })
            // 关闭菜单
            setOpen(false)
            // 跳转到首页
            navigate('/')
        }
    }

    const handleLogin = () => {
        setOpen(false)
        navigate('/auth/login')
    }

    const handleRegister = () => {
        setOpen(false)
        navigate('/auth/register')
    }

    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
        }
        prevOpen.current = open
    }, [open])

    // 获取用户头像显示的字母
    const getAvatarLetter = () => {
        if (user?.username) {
            return user.username.charAt(0).toUpperCase()
        }
        return <IconUser size={20} />
    }

    // 获取角色显示标签
    const getRoleLabel = (role) => {
        const roleMap = {
            admin: { label: t('auth.roleAdmin') || '管理员', color: 'error' },
            user: { label: t('auth.roleUser') || '用户', color: 'primary' }
        }
        return roleMap[role] || { label: role, color: 'default' }
    }

    return (
        <>
            <ButtonBase ref={anchorRef} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Avatar
                    variant='rounded'
                    sx={{
                        ...theme.typography.commonAvatar,
                        ...theme.typography.mediumAvatar,
                        transition: 'all .2s ease-in-out',
                        background: isAuthenticated ? theme.palette.primary.light : theme.palette.secondary.light,
                        color: isAuthenticated ? theme.palette.primary.dark : theme.palette.secondary.dark,
                        '&:hover': {
                            background: isAuthenticated ? theme.palette.primary.dark : theme.palette.secondary.dark,
                            color: isAuthenticated ? theme.palette.primary.light : theme.palette.secondary.light
                        }
                    }}
                    onClick={handleToggle}
                    color='inherit'
                >
                    {isAuthenticated ? getAvatarLetter() : <IconUserCircle stroke={1.5} size='1.3rem' />}
                </Avatar>
            </ButtonBase>

            <Popper
                placement='bottom-end'
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                popperOptions={{
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 14]
                            }
                        }
                    ]
                }}
            >
                {({ TransitionProps }) => (
                    <Transitions in={open} {...TransitionProps}>
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                                    {isAuthenticated ? (
                                        // 已登录状态
                                        <>
                                            <Box sx={{ p: 2, pb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            bgcolor: theme.palette.primary.main
                                                        }}
                                                    >
                                                        {user?.username?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant='h5'>{user?.username}</Typography>
                                                        <Typography variant='body2' color='text.secondary'>
                                                            {user?.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {user?.role && (
                                                    <Box sx={{ mt: 1.5 }}>
                                                        <Chip
                                                            size='small'
                                                            label={getRoleLabel(user.role).label}
                                                            color={getRoleLabel(user.role).color}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                            <Divider />
                                            <Box sx={{ p: 1 }}>
                                                <List
                                                    component='nav'
                                                    sx={{
                                                        width: '100%',
                                                        maxWidth: 280,
                                                        minWidth: 240,
                                                        backgroundColor: theme.palette.background.paper,
                                                        borderRadius: '10px'
                                                    }}
                                                >
                                                    <ListItemButton
                                                        sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                        onClick={() => {
                                                            setOpen(false)
                                                            // TODO: 跳转到个人设置页面
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <IconSettings stroke={1.5} size='1.3rem' />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant='body2'>
                                                                    {t('auth.accountSettings') || '账户设置'}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                    <ListItemButton
                                                        sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                        onClick={handleLogout}
                                                    >
                                                        <ListItemIcon>
                                                            <IconLogout stroke={1.5} size='1.3rem' />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant='body2'>{t('auth.logout') || '退出登录'}</Typography>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                </List>
                                            </Box>
                                        </>
                                    ) : (
                                        // 未登录状态
                                        <Box sx={{ p: 2, minWidth: 240 }}>
                                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        bgcolor: theme.palette.grey[200],
                                                        color: theme.palette.grey[600],
                                                        margin: '0 auto',
                                                        mb: 1.5
                                                    }}
                                                >
                                                    <IconUserCircle size={32} />
                                                </Avatar>
                                                <Typography variant='h5' gutterBottom>
                                                    {t('auth.welcome') || '欢迎使用 Flowise'}
                                                </Typography>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {t('auth.loginPrompt') || '登录以解锁更多功能'}
                                                </Typography>
                                            </Box>
                                            <Button
                                                fullWidth
                                                variant='contained'
                                                startIcon={<IconLogin size={18} />}
                                                onClick={handleLogin}
                                                sx={{
                                                    mb: 1.5,
                                                    borderRadius: 2,
                                                    textTransform: 'none'
                                                }}
                                            >
                                                {t('auth.login') || '登录'}
                                            </Button>
                                            <Button
                                                fullWidth
                                                variant='outlined'
                                                startIcon={<IconUserPlus size={18} />}
                                                onClick={handleRegister}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none'
                                                }}
                                            >
                                                {t('auth.register') || '注册'}
                                            </Button>
                                        </Box>
                                    )}
                                </MainCard>
                            </ClickAwayListener>
                        </Paper>
                    </Transitions>
                )}
            </Popper>
        </>
    )
}

export default UserSection
