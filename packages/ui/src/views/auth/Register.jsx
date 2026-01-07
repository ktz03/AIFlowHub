import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    LinearProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconEye, IconEyeOff, IconBrandGithub, IconMail, IconLock, IconUser } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

// API
import authApi from '@/api/auth'

// Assets
import logoDark from '@/assets/images/flowise_logo_dark.png'
import logoLight from '@/assets/images/flowise_logo.png'

// 密码强度计算
const getPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 8) strength += 15
    if (/[a-z]/.test(password)) strength += 15
    if (/[A-Z]/.test(password)) strength += 15
    if (/[0-9]/.test(password)) strength += 15
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15
    return Math.min(strength, 100)
}

const getStrengthColor = (strength) => {
    if (strength < 30) return 'error'
    if (strength < 60) return 'warning'
    return 'success'
}

const getStrengthLabel = (strength, t) => {
    if (strength < 30) return t('auth.passwordWeak') || '弱'
    if (strength < 60) return t('auth.passwordMedium') || '中等'
    return t('auth.passwordStrong') || '强'
}

const Register = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const passwordStrength = getPasswordStrength(formData.password)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        // 验证密码
        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordMismatch') || '两次输入的密码不一致')
            return
        }

        if (formData.password.length < 6) {
            setError(t('auth.passwordTooShort') || '密码长度至少为6位')
            return
        }

        setLoading(true)

        try {
            const response = await authApi.register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            })

            if (response.data.success) {
                setSuccess(t('auth.registerSuccess') || '注册成功！正在跳转到登录页面...')
                setTimeout(() => {
                    navigate('/auth/login')
                }, 2000)
            }
        } catch (err) {
            const message = err.response?.data?.message || t('auth.registerFailed') || '注册失败，请重试'
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
                        alt='Flowise'
                        style={{ height: 50, marginBottom: 16 }}
                    />
                    <Typography variant='h3' fontWeight='600' color='text.primary'>
                        {t('auth.createAccount') || '创建账户'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        {t('auth.registerSubtitle') || '开始您的 AI 工作流之旅'}
                    </Typography>
                </Box>

                {error && (
                    <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity='success' sx={{ mb: 3, borderRadius: 2 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label={t('auth.username') || '用户名'}
                        name='username'
                        value={formData.username}
                        onChange={handleChange}
                        required
                        autoComplete='username'
                        autoFocus
                        sx={{ mb: 2.5 }}
                        helperText={t('auth.usernameHint') || '3-50位字母、数字或下划线'}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconUser size={20} stroke={1.5} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        fullWidth
                        label={t('auth.email') || '邮箱地址'}
                        name='email'
                        type='email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete='email'
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
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete='new-password'
                        sx={{ mb: 1 }}
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

                    {/* 密码强度指示器 */}
                    {formData.password && (
                        <Box sx={{ mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <LinearProgress
                                    variant='determinate'
                                    value={passwordStrength}
                                    color={getStrengthColor(passwordStrength)}
                                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant='caption' color='text.secondary'>
                                    {getStrengthLabel(passwordStrength, t)}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label={t('auth.confirmPassword') || '确认密码'}
                        name='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        autoComplete='new-password'
                        sx={{ mb: 3 }}
                        error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                        helperText={
                            formData.confirmPassword && formData.password !== formData.confirmPassword
                                ? t('auth.passwordMismatch') || '密码不匹配'
                                : ''
                        }
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconLock size={20} stroke={1.5} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge='end' size='small'>
                                        {showConfirmPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Button
                        type='submit'
                        fullWidth
                        variant='contained'
                        size='large'
                        disabled={loading || (formData.confirmPassword && formData.password !== formData.confirmPassword)}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: theme.palette.mode === 'dark' ? 'none' : 2
                        }}
                    >
                        {loading ? <CircularProgress size={24} color='inherit' /> : t('auth.register') || '注册'}
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
                        {t('auth.continueWithGithub') || '使用 GitHub 注册'}
                    </Button>
                </Stack>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                        {t('auth.hasAccount') || '已有账户？'}{' '}
                        <Link
                            to='/auth/login'
                            style={{
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            {t('auth.loginNow') || '立即登录'}
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

export default Register
