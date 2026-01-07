import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { useTranslation } from 'react-i18next'
import moment from 'moment'

// material-ui
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    useTheme
} from '@mui/material'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { styled } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'

// API
import usageStatsApi from '@/api/usageStats'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import {
    IconChartBar,
    IconCoin,
    IconClock,
    IconCheck,
    IconDownload,
    IconX,
    IconActivity,
    IconBrandOpenai,
    IconRobot,
    IconTrash
} from '@tabler/icons-react'

// Charts
import ReactECharts from 'echarts-for-react'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,
    padding: '6px 16px',
    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 48
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

// 统计卡片组件
const StatCard = ({ title, value, icon: Icon, color, suffix, loading }) => {
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
const UsageStats = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const { t } = useTranslation()
    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // 状态
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [overview, setOverview] = useState({})
    const [trend, setTrend] = useState([])
    const [modelDist, setModelDist] = useState([])
    const [providerDist, setProviderDist] = useState([])
    const [logs, setLogs] = useState([])
    const [logsTotal, setLogsTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // 筛选条件
    const [startDate, setStartDate] = useState(moment().subtract(30, 'days'))
    const [endDate, setEndDate] = useState(moment())
    const [granularity, setGranularity] = useState('day')
    const [clearDialogOpen, setClearDialogOpen] = useState(false)

    // API hooks
    const overviewApi = useApi(usageStatsApi.getOverview)
    const trendApi = useApi(usageStatsApi.getTrend)
    const modelDistApi = useApi(usageStatsApi.getModelDistribution)
    const providerDistApi = useApi(usageStatsApi.getProviderDistribution)
    const logsApi = useApi(usageStatsApi.getLogs)

    // 加载数据
    const loadData = useCallback(() => {
        const params = {
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD')
        }
        overviewApi.request(params)
        trendApi.request({ ...params, granularity })
        modelDistApi.request(params)
        providerDistApi.request(params)
        logsApi.request({ ...params, page: page + 1, limit: rowsPerPage })
    }, [startDate, endDate, granularity, page, rowsPerPage])

    useEffect(() => {
        loadData()
    }, [loadData])

    // 处理API响应
    useEffect(() => {
        if (overviewApi.data?.data) setOverview(overviewApi.data.data)
    }, [overviewApi.data])

    useEffect(() => {
        if (trendApi.data?.data) setTrend(trendApi.data.data)
    }, [trendApi.data])

    useEffect(() => {
        if (modelDistApi.data?.data) setModelDist(modelDistApi.data.data)
    }, [modelDistApi.data])

    useEffect(() => {
        if (providerDistApi.data?.data) setProviderDist(providerDistApi.data.data)
    }, [providerDistApi.data])

    useEffect(() => {
        if (logsApi.data?.data) {
            setLogs(logsApi.data.data.logs || [])
            setLogsTotal(logsApi.data.data.total || 0)
        }
    }, [logsApi.data])

    useEffect(() => {
        setLoading(overviewApi.loading || trendApi.loading)
    }, [overviewApi.loading, trendApi.loading])

    useEffect(() => {
        if (overviewApi.error) setError(overviewApi.error)
    }, [overviewApi.error])

    // 导出数据
    const handleExport = async () => {
        try {
            const response = await usageStatsApi.exportData({
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD')
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `usage-report-${moment().format('YYYY-MM-DD')}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            enqueueSnackbar({
                message: t('stats.exportSuccess'),
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

    // 清除记录
    const handleClearLogs = async () => {
        try {
            const response = await usageStatsApi.clearAll()
            setClearDialogOpen(false)
            enqueueSnackbar({
                message: response.data?.message || t('stats.clearSuccess'),
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
            // 重新加载数据
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

    // 趋势图配置
    const trendChartOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: [t('stats.calls'), t('stats.tokens')] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: trend.map((d) => d.date) },
        yAxis: [
            { type: 'value', name: t('stats.calls') },
            { type: 'value', name: t('stats.tokens') }
        ],
        series: [
            {
                name: t('stats.calls'),
                type: 'bar',
                data: trend.map((d) => d.calls),
                itemStyle: { color: theme.palette.primary.main }
            },
            {
                name: t('stats.tokens'),
                type: 'line',
                yAxisIndex: 1,
                data: trend.map((d) => d.tokens),
                itemStyle: { color: theme.palette.secondary.main }
            }
        ]
    }

    // 模型分布饼图配置
    const modelPieOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: modelDist.map((d) => ({ name: d.model, value: d.calls }))
            }
        ]
    }

    // 提供商分布饼图配置
    const providerPieOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
            {
                type: 'pie',
                radius: '70%',
                data: providerDist.map((d) => ({ name: d.provider, value: d.calls })),
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
            }
        ]
    }

    const handleChangePage = (event, newPage) => setPage(newPage)
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader titleKey='stats.title'>
                            <Stack direction='row' spacing={2} alignItems='center'>
                                <LocalizationProvider dateAdapter={AdapterMoment}>
                                    <DatePicker
                                        label={t('stats.startDate')}
                                        value={startDate}
                                        onChange={setStartDate}
                                        slotProps={{ textField: { size: 'small' } }}
                                    />
                                    <DatePicker
                                        label={t('stats.endDate')}
                                        value={endDate}
                                        onChange={setEndDate}
                                        slotProps={{ textField: { size: 'small' } }}
                                    />
                                </LocalizationProvider>
                                <FormControl size='small' sx={{ minWidth: 100 }}>
                                    <InputLabel>{t('stats.granularity')}</InputLabel>
                                    <Select
                                        value={granularity}
                                        label={t('stats.granularity')}
                                        onChange={(e) => setGranularity(e.target.value)}
                                    >
                                        <MenuItem value='day'>{t('stats.day')}</MenuItem>
                                        <MenuItem value='week'>{t('stats.week')}</MenuItem>
                                        <MenuItem value='month'>{t('stats.month')}</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button variant='outlined' startIcon={<IconDownload />} onClick={handleExport}>
                                    {t('stats.export')}
                                </Button>
                                <Button variant='outlined' color='error' startIcon={<IconTrash />} onClick={() => setClearDialogOpen(true)}>
                                    {t('stats.clearLogs')}
                                </Button>
                            </Stack>
                        </ViewHeader>

                        {/* 概览卡片 */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <StatCard
                                    title={t('stats.totalCalls')}
                                    value={overview.totalCalls || 0}
                                    icon={IconActivity}
                                    color='primary'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <StatCard
                                    title={t('stats.totalTokens')}
                                    value={overview.totalTokens || 0}
                                    icon={IconChartBar}
                                    color='secondary'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <StatCard
                                    title={t('stats.totalCost')}
                                    value={`$${(overview.totalCost || 0).toFixed(4)}`}
                                    icon={IconCoin}
                                    color='warning'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <StatCard
                                    title={t('stats.avgLatency')}
                                    value={overview.avgLatency || 0}
                                    icon={IconClock}
                                    color='info'
                                    suffix='ms'
                                    loading={isLoading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2.4}>
                                <StatCard
                                    title={t('stats.successRate')}
                                    value={`${(overview.successRate || 100).toFixed(1)}%`}
                                    icon={IconCheck}
                                    color='success'
                                    loading={isLoading}
                                />
                            </Grid>
                        </Grid>

                        {/* 图表区域 */}
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant='h6' gutterBottom>
                                            {t('stats.usageTrend')}
                                        </Typography>
                                        {isLoading ? (
                                            <Skeleton variant='rectangular' height={300} />
                                        ) : trend.length > 0 ? (
                                            <ReactECharts
                                                option={trendChartOption}
                                                style={{ height: 300 }}
                                                notMerge={true}
                                                lazyUpdate={true}
                                            />
                                        ) : (
                                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography color='text.secondary'>{t('stats.noData')}</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6' gutterBottom>
                                            {t('stats.modelDistribution')}
                                        </Typography>
                                        {isLoading ? (
                                            <Skeleton variant='rectangular' height={300} />
                                        ) : modelDist.length > 0 ? (
                                            <ReactECharts
                                                option={modelPieOption}
                                                style={{ height: 300 }}
                                                notMerge={true}
                                                lazyUpdate={true}
                                            />
                                        ) : (
                                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography color='text.secondary'>{t('stats.noData')}</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6' gutterBottom>
                                            {t('stats.providerDistribution')}
                                        </Typography>
                                        {isLoading ? (
                                            <Skeleton variant='rectangular' height={300} />
                                        ) : providerDist.length > 0 ? (
                                            <ReactECharts
                                                option={providerPieOption}
                                                style={{ height: 300 }}
                                                notMerge={true}
                                                lazyUpdate={true}
                                            />
                                        ) : (
                                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography color='text.secondary'>{t('stats.noData')}</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* 使用日志表格 */}
                        <Card>
                            <CardContent>
                                <Typography variant='h6' gutterBottom>
                                    {t('stats.usageLogs')}
                                </Typography>
                                <TableContainer
                                    component={Paper}
                                    sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                                >
                                    <Table>
                                        <TableHead
                                            sx={{
                                                backgroundColor: customization.isDarkMode
                                                    ? theme.palette.common.black
                                                    : theme.palette.grey[100]
                                            }}
                                        >
                                            <TableRow>
                                                <StyledTableCell>{t('stats.time')}</StyledTableCell>
                                                <StyledTableCell>{t('stats.provider')}</StyledTableCell>
                                                <StyledTableCell>{t('stats.model')}</StyledTableCell>
                                                <StyledTableCell align='right'>{t('stats.inputTokens')}</StyledTableCell>
                                                <StyledTableCell align='right'>{t('stats.outputTokens')}</StyledTableCell>
                                                <StyledTableCell align='right'>{t('stats.cost')}</StyledTableCell>
                                                <StyledTableCell align='right'>{t('stats.latency')}</StyledTableCell>
                                                <StyledTableCell>{t('stats.status')}</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {logsApi.loading ? (
                                                [1, 2, 3, 4, 5].map((i) => (
                                                    <StyledTableRow key={i}>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                                                            <StyledTableCell key={j}>
                                                                <Skeleton variant='text' />
                                                            </StyledTableCell>
                                                        ))}
                                                    </StyledTableRow>
                                                ))
                                            ) : logs.length > 0 ? (
                                                logs.map((log) => (
                                                    <StyledTableRow key={log.id}>
                                                        <StyledTableCell>
                                                            {moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            <Chip label={log.provider} size='small' variant='outlined' />
                                                        </StyledTableCell>
                                                        <StyledTableCell>{log.model}</StyledTableCell>
                                                        <StyledTableCell align='right'>{log.inputTokens?.toLocaleString()}</StyledTableCell>
                                                        <StyledTableCell align='right'>
                                                            {log.outputTokens?.toLocaleString()}
                                                        </StyledTableCell>
                                                        <StyledTableCell align='right'>${Number(log.cost).toFixed(6)}</StyledTableCell>
                                                        <StyledTableCell align='right'>
                                                            {log.latencyMs ? `${log.latencyMs}ms` : '-'}
                                                        </StyledTableCell>
                                                        <StyledTableCell>
                                                            <Chip
                                                                label={log.status === 'success' ? t('stats.success') : t('stats.failed')}
                                                                color={log.status === 'success' ? 'success' : 'error'}
                                                                size='small'
                                                            />
                                                        </StyledTableCell>
                                                    </StyledTableRow>
                                                ))
                                            ) : (
                                                <StyledTableRow>
                                                    <StyledTableCell colSpan={8} align='center'>
                                                        <Typography color='text.secondary'>{t('stats.noData')}</Typography>
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component='div'
                                    count={logsTotal}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    rowsPerPageOptions={[10, 25, 50]}
                                    labelRowsPerPage={t('common.rowsPerPage')}
                                />
                            </CardContent>
                        </Card>
                    </Stack>
                )}
            </MainCard>

            {/* 清除记录确认对话框 */}
            <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
                <DialogTitle>{t('stats.clearLogsTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t('stats.clearLogsConfirm')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClearDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleClearLogs} color='error' variant='contained'>
                        {t('stats.clearLogs')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default UsageStats
