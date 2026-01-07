import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import { Box, Button, Card, IconButton, Stack, Typography, useTheme } from '@mui/material'
import { IconCopy, IconRefresh, IconAlertTriangle, IconWifi, IconServer, IconLock } from '@tabler/icons-react'

const ErrorBoundary = ({ error, onRetry }) => {
    const theme = useTheme()
    const { t } = useTranslation()

    // 获取错误状态码
    const getStatusCode = () => {
        if (error?.response?.status) return error.response.status
        if (error?.statusCode) return error.statusCode
        if (error?.status) return error.status
        return 500
    }

    // 获取错误消息
    const getErrorMessage = () => {
        if (error?.response?.data?.message) return error.response.data.message
        if (error?.response?.data?.error?.message) return error.response.data.error.message
        if (error?.message) return error.message
        return t('error.unknown') || '未知错误'
    }

    // 根据状态码获取图标和标题
    const getErrorInfo = () => {
        const status = getStatusCode()

        if (status === 401 || status === 403) {
            return {
                icon: IconLock,
                title: t('error.authTitle') || '访问受限',
                description: t('error.authDesc') || '您没有权限访问此资源，请登录或联系管理员'
            }
        }
        if (status === 404) {
            return {
                icon: IconAlertTriangle,
                title: t('error.notFoundTitle') || '资源不存在',
                description: t('error.notFoundDesc') || '请求的资源不存在或已被删除'
            }
        }
        if (status >= 500) {
            return {
                icon: IconServer,
                title: t('error.serverTitle') || '服务器错误',
                description: t('error.serverDesc') || '服务器暂时无法处理请求，请稍后重试'
            }
        }
        if (!navigator.onLine || error?.code === 'ERR_NETWORK') {
            return {
                icon: IconWifi,
                title: t('error.networkTitle') || '网络错误',
                description: t('error.networkDesc') || '请检查您的网络连接'
            }
        }

        return {
            icon: IconAlertTriangle,
            title: t('error.defaultTitle') || '出错了',
            description: t('error.defaultDesc') || '加载页面时发生错误'
        }
    }

    const copyToClipboard = () => {
        const errorMessage = `Status: ${getStatusCode()}\nMessage: ${getErrorMessage()}\nTime: ${new Date().toISOString()}`
        navigator.clipboard.writeText(errorMessage)
    }

    const errorInfo = getErrorInfo()
    const ErrorIcon = errorInfo.icon

    return (
        <Box sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2, padding: '20px', maxWidth: '1280px' }}>
            <Stack flexDirection='column' sx={{ alignItems: 'center', gap: 3 }}>
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.error.lighter || theme.palette.error.light + '20',
                        color: theme.palette.error.main
                    }}
                >
                    <ErrorIcon size={40} />
                </Box>

                <Stack flexDirection='column' sx={{ alignItems: 'center', gap: 1 }}>
                    <Typography variant='h2'>{errorInfo.title}</Typography>
                    <Typography variant='body1' color='text.secondary' textAlign='center'>
                        {errorInfo.description}
                    </Typography>
                </Stack>

                <Card variant='outlined'>
                    <Box sx={{ position: 'relative', px: 2, py: 3, minWidth: 300 }}>
                        <IconButton
                            onClick={copyToClipboard}
                            size='small'
                            sx={{ position: 'absolute', top: 1, right: 1, color: theme.palette.grey[500] }}
                            title={t('common.copy') || '复制'}
                        >
                            <IconCopy size={18} />
                        </IconButton>
                        <pre style={{ margin: 0, fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                            <code>{`Status: ${getStatusCode()}`}</code>
                            <br />
                            <code>{getErrorMessage()}</code>
                        </pre>
                    </Box>
                </Card>

                <Stack direction='row' spacing={2}>
                    {onRetry && (
                        <Button variant='contained' startIcon={<IconRefresh size={18} />} onClick={onRetry}>
                            {t('common.retry') || '重试'}
                        </Button>
                    )}
                    <Button variant='outlined' onClick={() => window.location.reload()}>
                        {t('common.refresh') || '刷新页面'}
                    </Button>
                </Stack>

                <Typography variant='body2' color='text.secondary' textAlign='center'>
                    {t('error.helpText') || '如果问题持续存在，请联系技术支持'}
                </Typography>
            </Stack>
        </Box>
    )
}

ErrorBoundary.propTypes = {
    error: PropTypes.object,
    onRetry: PropTypes.func
}

export default ErrorBoundary
