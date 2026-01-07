import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { useTranslation } from 'react-i18next'

// material-ui
import { Box, Button, Card, CardContent, Chip, Grid, LinearProgress, Skeleton, Slider, Stack, Typography, useTheme } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import QuotaProgress from '@/ui-component/quota/QuotaProgress'

// API
import quotaApi from '@/api/quota'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconGauge, IconAlertTriangle, IconCheck, IconX, IconRefresh, IconSettings, IconArrowsExchange } from '@tabler/icons-react'

// 统计卡片组件
const StatCard = ({ title, value, icon: Icon, color, suffix, loading, description }) => {
    const theme = useTheme()
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                    <Box>
                        <Typography variant='body2' color='text.secondary' gutterBottom>
                            {title}
                        </Typography>
                        {loading ? (
                            <Skeleton variant='text' width={100} height={40} />
                        ) : (
                            <Typography variant='h4' fontWeight='bold'>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                                {suffix && (
                                    <Typography component='span' variant='body2' color='text.secondary'>
                                        {' '}
                                        {suffix}
                                    </Typography>
                                )}
                            </Typography>
                        )}
                        {description && (
                            <Typography variant='caption' color='text.secondary'>
                                {description}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${color}.lighter`,
                            color: `${color}.main`
                        }}
                    >
                        <Icon size={28} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}

// 主组件
const QuotaManagement = () => {
    const theme = useTheme()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // 状态
    const [isLoading, setLoading] = useState(true)
    const [isSyncing, setSyncing] = useState(false)
    const [error, setError] = useState(null)
    const [quotaInfo, setQuotaInfo] = useState(null)
    const [warningThreshold, setWarningThreshold] = useState(80)
    const [thresholdChanged, setThresholdChanged] = useState(false)

    // API hooks
    const quotaInfoApi = useApi(quotaApi.getMyQuota)

    // 加载数据
    const loadData = useCallback(() => {
        quotaInfoApi.request()
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // 处理API响应
    useEffect(() => {
        if (quotaInfoApi.data?.data) {
            setQuotaInfo(quotaInfoApi.data.data)
            setWarningThreshold(quotaInfoApi.data.data.warningThreshold || 80)
        }
    }, [quotaInfoApi.data])

    useEffect(() => {
        setLoading(quotaInfoApi.loading)
    }, [quotaInfoApi.loading])

    useEffect(() => {
        if (quotaInfoApi.error) setError(quotaInfoApi.error)
    }, [quotaInfoApi.error])

    // 保存预警阈值
    const handleSaveThreshold = async () => {
        try {
            await quotaApi.setWarningThreshold(warningThreshold)
            setThresholdChanged(false)
            enqueueSnackbar({
                message: t('quota.thresholdSaved'),
                options: {
                    variant: 'success',
                    key: new Date().getTime() + Math.random(),
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            loadData()
        } catch (error) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${error.message}`,
                options: {
                    variant: 'error',
                    key: new Date().getTime() + Math.random(),
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    // 同步配额数据
    const handleSyncQuota = async () => {
        setSyncing(true)
        try {
            await quotaApi.syncMyQuota()
            enqueueSnackbar({
                message: t('quota.syncSuccess'),
                options: {
                    variant: 'success',
                    key: new Date().getTime() + Math.random(),
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            loadData()
        } catch (error) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${error.message}`,
                options: {
                    variant: 'error',
                    key: new Date().getTime() + Math.random(),
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } finally {
            setSyncing(false)
        }
    }

    const formatNumber = (num) => {
        if (!num) return '0'
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
        return num.toLocaleString()
    }

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader titleKey='quota.title'>
                            <Stack direction='row' spacing={1}>
                                <Button
                                    variant='outlined'
                                    startIcon={<IconArrowsExchange />}
                                    onClick={handleSyncQuota}
                                    disabled={isLoading || isSyncing}
                                >
                                    {isSyncing ? t('common.syncing') : t('quota.sync')}
                                </Button>
                                <Button variant='outlined' startIcon={<IconRefresh />} onClick={loadData} disabled={isLoading}>
                                    {t('common.refresh')}
                                </Button>
                            </Stack>
                        </ViewHeader>

                        {/* 配额概览卡片 */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title={t('quota.totalQuota')}
                                    value={formatNumber(quotaInfo?.quotaLimit)}
                                    icon={IconGauge}
                                    color='primary'
                                    suffix='tokens'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title={t('quota.usedQuota')}
                                    value={formatNumber(quotaInfo?.quotaUsed)}
                                    icon={IconGauge}
                                    color='secondary'
                                    suffix='tokens'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title={t('quota.remainingQuota')}
                                    value={formatNumber(quotaInfo?.quotaRemaining)}
                                    icon={quotaInfo?.isExhausted ? IconAlertTriangle : IconCheck}
                                    color={quotaInfo?.isExhausted ? 'error' : quotaInfo?.isWarning ? 'warning' : 'success'}
                                    suffix='tokens'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title={t('quota.usagePercentage')}
                                    value={`${quotaInfo?.usagePercentage || 0}%`}
                                    icon={IconGauge}
                                    color={quotaInfo?.isExhausted ? 'error' : quotaInfo?.isWarning ? 'warning' : 'info'}
                                    loading={isLoading}
                                />
                            </Grid>
                        </Grid>

                        {/* 配额进度条 */}
                        <Card>
                            <CardContent>
                                <Typography variant='h6' gutterBottom>
                                    {t('quota.usageProgress')}
                                </Typography>
                                {isLoading ? (
                                    <Skeleton variant='rectangular' height={40} />
                                ) : quotaInfo ? (
                                    <Box sx={{ mt: 2 }}>
                                        <QuotaProgress
                                            quotaUsed={quotaInfo.quotaUsed}
                                            quotaLimit={quotaInfo.quotaLimit}
                                            warningThreshold={quotaInfo.warningThreshold}
                                            size='large'
                                        />
                                        <Stack direction='row' justifyContent='space-between' sx={{ mt: 2 }}>
                                            <Box>
                                                {quotaInfo.isExhausted && (
                                                    <Chip
                                                        icon={<IconAlertTriangle size={16} />}
                                                        label={t('quota.exhausted')}
                                                        color='error'
                                                        size='small'
                                                    />
                                                )}
                                                {quotaInfo.isWarning && !quotaInfo.isExhausted && (
                                                    <Chip
                                                        icon={<IconAlertTriangle size={16} />}
                                                        label={t('quota.warning')}
                                                        color='warning'
                                                        size='small'
                                                    />
                                                )}
                                                {!quotaInfo.isWarning && !quotaInfo.isExhausted && (
                                                    <Chip
                                                        icon={<IconCheck size={16} />}
                                                        label={t('quota.normal')}
                                                        color='success'
                                                        size='small'
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant='body2' color='text.secondary'>
                                                {t('quota.warningAt')} {quotaInfo.warningThreshold}%
                                            </Typography>
                                        </Stack>
                                    </Box>
                                ) : null}
                            </CardContent>
                        </Card>

                        {/* 预警阈值设置 */}
                        <Card>
                            <CardContent>
                                <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
                                    <IconSettings size={20} />
                                    <Typography variant='h6'>{t('quota.warningSettings')}</Typography>
                                </Stack>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                    {t('quota.warningSettingsDesc')}
                                </Typography>
                                <Box sx={{ px: 2 }}>
                                    <Slider
                                        value={warningThreshold}
                                        onChange={(e, value) => {
                                            setWarningThreshold(value)
                                            setThresholdChanged(true)
                                        }}
                                        min={50}
                                        max={100}
                                        step={5}
                                        marks={[
                                            { value: 50, label: '50%' },
                                            { value: 70, label: '70%' },
                                            { value: 80, label: '80%' },
                                            { value: 90, label: '90%' },
                                            { value: 100, label: '100%' }
                                        ]}
                                        valueLabelDisplay='on'
                                        valueLabelFormat={(value) => `${value}%`}
                                    />
                                </Box>
                                {thresholdChanged && (
                                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                                        <Button variant='contained' onClick={handleSaveThreshold}>
                                            {t('common.save')}
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* 配额说明 */}
                        <Card>
                            <CardContent>
                                <Typography variant='h6' gutterBottom>
                                    {t('quota.about')}
                                </Typography>
                                <Typography variant='body2' color='text.secondary' paragraph>
                                    {t('quota.aboutDesc1')}
                                </Typography>
                                <Typography variant='body2' color='text.secondary' paragraph>
                                    {t('quota.aboutDesc2')}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    {t('quota.aboutDesc3')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                )}
            </MainCard>
        </>
    )
}

export default QuotaManagement
