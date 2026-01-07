import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
    Divider,
    Stack,
    FormControlLabel,
    Checkbox,
    Collapse
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconEye, IconEyeOff, IconBrandGithub, IconMail, IconLock, IconAlertCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

// API
import authApi from '@/api/auth'

// Store
import { SET_USER } from '@/store/actions'

// Assets
import logoDark from '@/assets/images/flowise_logo_dark.png'
import logoLight from '@/assets/images/flowise_logo.png'

// 邮箱验证正则
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Login = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { t } = useTranslation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    // 表单验证状态
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [touched, setTouched] = useState({ email: false, password: false })

    // 从 localStorage 恢复记住的邮箱
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail')
        if (savedEmail) {
            setEmail(savedEmail)
            setRememberMe(true)
        }
    }, [])

    // 邮箱验证
    const validateEmail = (value) => {
        if (!value) {
            return t('auth.emailRequired') || '请输入邮箱地址'
        }
        if (!EMAIL_REGEX.test(value)) {
            return t('auth.emailInvalid') || '请输入有效的邮箱地址'
        }
        return ''
    }

    // 密码验证
    const validatePassword = (value) => {
        if (!value) {
            return t('auth.passwordRequired') || '请输入密码'
        }
        if (value.length < 6) {
            return t('auth.passwordTooShort') || '密码长度至少为6位'
        }
        return ''
    }

    // 处理邮箱变化
    const handleEmailChange = (e) => {
        const value = e.target.value
        setEmail(value)
        if (touched.email) {
            setEmailError(validateEmail(value))
        }
    }

    // 处理密码变化
    const handlePasswordChange = (e) => {
        const value = e.target.value
        setPassword(value)
        if (touched.password) {
            setPasswordError(validatePassword(value))
        }
    }

    // 处理失焦验证
    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true })
        if (field === 'email') {
            setEmailError(validateEmail(email))
        } else if (field === 'password') {
            setPasswordError(validatePassword(password))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // 触发所有字段验证
        setTouched({ email: true, password: true })
        const emailErr = validateEmail(email)
        const passwordErr = validatePassword(password)
        setEmailError(emailErr)
        setPasswordError(passwordErr)

        // 如果有验证错误，不提交
        if (emailErr || passwordErr) {
            return
        }

        setLoading(true)

        try {
            const response = await authApi.login({ email, password })

            if (response.data.success) {
                const { user, tokens } = response.data.data

                // 保存 Token
                localStorage.setItem('accessToken', tokens.accessToken)
                localStorage.setItem('refreshToken', tokens.refreshToken)

                // 保存用户信息到 localStorage（用于菜单权限判断）
                localStorage.setItem('user', JSON.stringify(user))

                // 处理记住密码
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email)
                } else {
                    localStorage.removeItem('rememberedEmail')
                }

                // 更新 Redux store
                dispatch({ type: SET_USER, user })

                // 跳转到首页
                navigate('/chatflows')
            }
        } catch (err) {
            const message = err.response?.data?.message || t('auth.loginFailed') || '登录失败，请重试'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                    theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                        : `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.secondary.light}22 100%)`,
                padding: 3
            }}
        >
            <Paper
                elevation={theme.palette.mode === 'dark' ? 2 : 8}
                sx={{
                    padding: { xs: 3, sm: 5 },
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 4,
                    background: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
                    border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
                }}
            >
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <img
                        src={theme.palette.mode === 'dark' ? logoDark : logoLight}
                        alt='AIFlowHub'
                        style={{ height: 50, marginBottom: 16 }}
                    />
                    <Typography variant='h3' fontWeight='600' color='text.primary'>
                        {t('auth.welcomeBack') || '欢迎回来'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        {t('auth.loginSubtitle') || '登录您的账户以继续'}
                    </Typography>
                </Box>

                {error && (
                    <Collapse in={!!error}>
                        <Alert 
                            severity='error' 
                            sx={{ mb: 3, borderRadius: 2 }}
                            icon={<IconAlertCircle size={20} />}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    </Collapse>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label={t('auth.email') || '邮箱地址'}
                        type='email'
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={() => handleBlur('email')}
                        error={touched.email && !!emailError}
                        helperText={touched.email && emailError}
                        required
                        autoComplete='email'
                        autoFocus
                        sx={{ mb: 2.5 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconMail size={20} stroke={1.5} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        fullWidth
                        label={t('auth.password') || '密码'}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleBlur('password')}
                        error={touched.password && !!passwordError}
                        helperText={touched.password && passwordError}
                        required
                        autoComplete='current-password'
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconLock size={20} stroke={1.5} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge='end' size='small'>
                                        {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                color='primary'
                                size='small'
                            />
                        }
                        label={
                            <Typography variant='body2' color='text.secondary'>
                                {t('auth.rememberMe') || '记住我'}
                            </Typography>
                        }
                        sx={{ mb: 2 }}
                    />

                    <Button
                        type='submit'
                        fullWidth
                        variant='contained'
                        size='large'
                        disabled={loading || (touched.email && !!emailError) || (touched.password && !!passwordError)}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: theme.palette.mode === 'dark' ? 'none' : 2
                        }}
                    >
                        {loading ? <CircularProgress size={24} color='inherit' /> : t('auth.login') || '登录'}
                    </Button>
                </form>

                <Divider sx={{ my: 3 }}>
                    <Typography variant='body2' color='text.secondary'>
                        {t('auth.or') || '或'}
                    </Typography>
                </Divider>

                <Stack spacing={2}>
                    <Button
                        fullWidth
                        variant='outlined'
                        size='large'
                        startIcon={<IconBrandGithub size={20} />}
                        sx={{
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.primary,
                            '&:hover': {
                                borderColor: theme.palette.text.secondary,
                                background: theme.palette.action.hover
                            }
                        }}
                        disabled
                    >
                        {t('auth.continueWithGithub') || '使用 GitHub 登录'}
                    </Button>
                </Stack>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                        {t('auth.noAccount') || '还没有账户？'}{' '}
                        <Link
                            to='/auth/register'
                            style={{
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            {t('auth.registerNow') || '立即注册'}
                        </Link>
                    </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link
                        to='/'
                        style={{
                            color: theme.palette.text.secondary,
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                        }}
                    >
                        ← {t('auth.backToHome') || '返回首页'}
                    </Link>
                </Box>
            </Paper>
        </Box>
    )
}

export default Login
