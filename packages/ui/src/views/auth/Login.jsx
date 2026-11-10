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
import logo from '@/assets/images/aiflow_logo.png'

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

            console.log('=== 登录调试信息 ===')
            console.log('1. 完整响应对象:', response)
            console.log('2. response.data:', response.data)
            console.log('3. response.data.success:', response.data.success)
            console.log('4. typeof success:', typeof response.data.success)
            console.log('5. response.data.data:', response.data.data)

            if (response.data && response.data.success) {
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
            } else {
                console.error('=== 登录失败 ===')
                console.error('response.data:', response.data)
                console.error('success 值为 false 或不存在')
                setError(response.data?.message || '登录失败，请重试')
            }
        } catch (err) {
            console.error('=== 登录异常 ===')
            console.error('错误对象:', err)
            console.error('错误消息:', err.message)
            console.error('错误响应:', err.response)
            console.error('响应数据:', err.response?.data)
            console.error('响应状态:', err.response?.status)
            const message = err.response?.data?.message || err.message || t('auth.loginFailed') || '登录失败，请重试'
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
                background: '#f5f5f5',
                padding: 3
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: { xs: 3, sm: 5 },
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 4,
                    background: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
            >
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <img src={logo} alt='AIFlowHub' style={{ height: 60, marginBottom: 16 }} />
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
                        sx={{
                            mb: 2.5,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#ffffff',
                                '& fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.23)'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.4)'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#2196f3',
                                    borderWidth: 2
                                },
                                '& input': {
                                    color: 'rgba(0, 0, 0, 0.87)',
                                    backgroundColor: '#ffffff'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(0, 0, 0, 0.6)',
                                '&.Mui-focused': {
                                    color: '#2196f3'
                                }
                            },
                            '& .MuiFormHelperText-root': {
                                color: 'rgba(0, 0, 0, 0.6)',
                                '&.Mui-error': {
                                    color: '#d32f2f'
                                }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconMail size={20} stroke={1.5} style={{ color: 'rgba(0, 0, 0, 0.54)' }} />
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
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#ffffff',
                                '& fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.23)'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.4)'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#2196f3',
                                    borderWidth: 2
                                },
                                '& input': {
                                    color: 'rgba(0, 0, 0, 0.87)',
                                    backgroundColor: '#ffffff'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(0, 0, 0, 0.6)',
                                '&.Mui-focused': {
                                    color: '#2196f3'
                                }
                            },
                            '& .MuiFormHelperText-root': {
                                color: 'rgba(0, 0, 0, 0.6)',
                                '&.Mui-error': {
                                    color: '#d32f2f'
                                }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconLock size={20} stroke={1.5} style={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge='end'
                                        size='small'
                                        sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                                    >
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
                                size='small'
                                sx={{
                                    color: 'rgba(0, 0, 0, 0.6)',
                                    '&.Mui-checked': {
                                        color: '#2196f3'
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(33, 150, 243, 0.04)'
                                    }
                                }}
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
                            boxShadow: 2
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
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                            color: 'rgba(0, 0, 0, 0.87)',
                            '&:hover': {
                                borderColor: 'rgba(0, 0, 0, 0.4)',
                                background: 'rgba(0, 0, 0, 0.04)'
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
                                color: '#2196f3',
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
                            color: 'rgba(0, 0, 0, 0.6)',
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
