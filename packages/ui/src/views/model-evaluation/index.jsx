import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    TextField,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material'
import {
    IconPlayerPlay,
    IconHistory,
    IconTrash,
    IconEye,
    IconChevronDown,
    IconClock,
    IconBolt,
    IconCheck,
    IconX
} from '@tabler/icons-react'
import MainCard from '@/ui-component/cards/MainCard'
import {
    getEvaluationScenarios,
    getAvailableChatflows,
    runEvaluation,
    getEvaluationHistory,
    getEvaluationById,
    deleteEvaluation
} from '@/api/modelEvaluation'

const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
}

const ResultsTable = ({ results }) => {
    if (!results || results.length === 0) return null

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size='small'>
                <TableHead>
                    <TableRow>
                        <TableCell>模型/工作流</TableCell>
                        <TableCell>状态</TableCell>
                        <TableCell>响应时间</TableCell>
                        <TableCell>Token数</TableCell>
                        <TableCell>生成速度</TableCell>
                        <TableCell sx={{ minWidth: 300 }}>响应内容</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((result, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Typography variant='body2' fontWeight='medium'>
                                    {result.modelName}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {result.success ? (
                                    <Chip icon={<IconCheck size={14} />} label='成功' color='success' size='small' />
                                ) : (
                                    <Chip icon={<IconX size={14} />} label='失败' color='error' size='small' />
                                )}
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <IconClock size={14} />
                                    {formatTime(result.metrics.responseTime)}
                                </Box>
                            </TableCell>
                            <TableCell>{result.metrics.totalTokens}</TableCell>
                            <TableCell>
                                {result.metrics.tokensPerSecond ? `${result.metrics.tokensPerSecond.toFixed(1)} t/s` : '-'}
                            </TableCell>
                            <TableCell>
                                {result.success ? (
                                    <Typography
                                        variant='body2'
                                        sx={{
                                            maxHeight: 100,
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {result.response.substring(0, 500)}
                                        {result.response.length > 500 && '...'}
                                    </Typography>
                                ) : (
                                    <Typography variant='body2' color='error'>
                                        {result.error}
                                    </Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

const ModelEvaluation = () => {
    const { t } = useTranslation()
    const [tabValue, setTabValue] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // 评测表单状态
    const [testInput, setTestInput] = useState('')
    const [selectedChatflows, setSelectedChatflows] = useState([])
    const [evaluationTitle, setEvaluationTitle] = useState('')

    // 数据状态
    const [chatflows, setChatflows] = useState([])
    const [scenarios, setScenarios] = useState([])
    const [evaluationResult, setEvaluationResult] = useState(null)
    const [history, setHistory] = useState([])
    const [historyTotal, setHistoryTotal] = useState(0)
    const [historyPage, setHistoryPage] = useState(1)

    // 详情弹窗
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailData, setDetailData] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (tabValue === 1) {
            loadHistory()
        }
    }, [tabValue, historyPage])

    const loadInitialData = async () => {
        try {
            const [chatflowsRes, scenariosRes] = await Promise.all([getAvailableChatflows(), getEvaluationScenarios()])
            setChatflows(chatflowsRes.data || [])
            setScenarios(scenariosRes.data || [])
        } catch (err) {
            console.error('加载数据失败:', err)
        }
    }

    const loadHistory = async () => {
        try {
            const res = await getEvaluationHistory(historyPage, 10)
            setHistory(res.data?.evaluations || [])
            setHistoryTotal(res.data?.total || 0)
        } catch (err) {
            console.error('加载历史失败:', err)
        }
    }

    const handleRunEvaluation = async () => {
        if (!testInput.trim()) {
            setError('请输入测试内容')
            return
        }
        if (selectedChatflows.length === 0) {
            setError('请至少选择一个工作流')
            return
        }

        setLoading(true)
        setError(null)
        setEvaluationResult(null)

        try {
            const res = await runEvaluation({
                testInput,
                chatflowIds: selectedChatflows,
                title: evaluationTitle || undefined
            })
            setEvaluationResult(res.data)
        } catch (err) {
            setError(err.response?.data?.message || '评测失败')
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetail = async (id) => {
        setDetailLoading(true)
        setDetailOpen(true)
        try {
            const res = await getEvaluationById(id)
            setDetailData(res.data)
        } catch (err) {
            console.error('加载详情失败:', err)
        } finally {
            setDetailLoading(false)
        }
    }

    const handleDeleteEvaluation = async (id) => {
        if (!window.confirm('确定要删除这条评测记录吗？')) return
        try {
            await deleteEvaluation(id)
            loadHistory()
        } catch (err) {
            console.error('删除失败:', err)
        }
    }

    const handleSelectScenario = (scenario) => {
        if (scenario.prompts && scenario.prompts.length > 0) {
            setTestInput(scenario.prompts[0])
        }
    }

    return (
        <MainCard title={t('modelEvaluation.title') || '模型评测'}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label='执行评测' />
                <Tab label='评测历史' />
            </Tabs>

            {tabValue === 0 && (
                <Box>
                    {error && (
                        <Alert severity='error' sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant='h6' gutterBottom>
                                        评测配置
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label='评测标题（可选）'
                                        value={evaluationTitle}
                                        onChange={(e) => setEvaluationTitle(e.target.value)}
                                        sx={{ mb: 2 }}
                                        size='small'
                                    />

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>选择工作流</InputLabel>
                                        <Select
                                            multiple
                                            value={selectedChatflows}
                                            onChange={(e) => setSelectedChatflows(e.target.value)}
                                            input={<OutlinedInput label='选择工作流' />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((id) => {
                                                        const cf = chatflows.find((c) => c.id === id)
                                                        return <Chip key={id} label={cf?.name || id} size='small' />
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {chatflows.map((cf) => (
                                                <MenuItem key={cf.id} value={cf.id}>
                                                    <Checkbox checked={selectedChatflows.includes(cf.id)} />
                                                    <ListItemText primary={cf.name} secondary={cf.type} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label='测试输入'
                                        placeholder='输入要测试的问题或提示...'
                                        value={testInput}
                                        onChange={(e) => setTestInput(e.target.value)}
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        variant='contained'
                                        startIcon={loading ? <CircularProgress size={20} /> : <IconPlayerPlay />}
                                        onClick={handleRunEvaluation}
                                        disabled={loading}
                                        fullWidth
                                    >
                                        {loading ? '评测中...' : '开始评测'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant='h6' gutterBottom>
                                        预设场景
                                    </Typography>
                                    {scenarios.map((scenario) => (
                                        <Accordion key={scenario.id} sx={{ mb: 1 }}>
                                            <AccordionSummary expandIcon={<IconChevronDown />}>
                                                <Typography>{scenario.name}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography variant='body2' color='text.secondary' gutterBottom>
                                                    {scenario.description}
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    {scenario.prompts?.slice(0, 2).map((prompt, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={prompt.substring(0, 20) + '...'}
                                                            size='small'
                                                            onClick={() => handleSelectScenario({ prompts: [prompt] })}
                                                            sx={{ mr: 0.5, mb: 0.5, cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {evaluationResult && (
                        <Box sx={{ mt: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant='h6' gutterBottom>
                                        评测结果
                                        {evaluationResult.summary && (
                                            <Chip
                                                label={`成功 ${evaluationResult.summary.successCount}/${evaluationResult.summary.totalModels}`}
                                                color='primary'
                                                size='small'
                                                sx={{ ml: 2 }}
                                            />
                                        )}
                                    </Typography>

                                    {evaluationResult.summary && (
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={6} md={3}>
                                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                    <IconBolt size={24} />
                                                    <Typography variant='body2' color='text.secondary'>
                                                        最快响应
                                                    </Typography>
                                                    <Typography variant='h6'>{evaluationResult.summary.fastestModel}</Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                                    <IconClock size={24} />
                                                    <Typography variant='body2' color='text.secondary'>
                                                        平均响应时间
                                                    </Typography>
                                                    <Typography variant='h6'>
                                                        {formatTime(evaluationResult.summary.avgResponseTime)}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    )}

                                    <ResultsTable results={evaluationResult.results} />
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
            )}

            {tabValue === 1 && (
                <Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>标题</TableCell>
                                    <TableCell>测试输入</TableCell>
                                    <TableCell>时间</TableCell>
                                    <TableCell>结果</TableCell>
                                    <TableCell>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.title}</TableCell>
                                        <TableCell>
                                            <Typography variant='body2' sx={{ maxWidth: 200 }} noWrap>
                                                {item.testInput}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{new Date(item.createdDate).toLocaleString('zh-CN')}</TableCell>
                                        <TableCell>
                                            {item.summary && (
                                                <Chip
                                                    label={`${item.summary.successCount}/${item.summary.totalModels}`}
                                                    color={item.summary.failCount > 0 ? 'warning' : 'success'}
                                                    size='small'
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title='查看详情'>
                                                <IconButton size='small' onClick={() => handleViewDetail(item.id)}>
                                                    <IconEye size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title='删除'>
                                                <IconButton size='small' color='error' onClick={() => handleDeleteEvaluation(item.id)}>
                                                    <IconTrash size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {history.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align='center'>
                                            <Typography color='text.secondary'>暂无评测记录</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='lg' fullWidth>
                <DialogTitle>评测详情</DialogTitle>
                <DialogContent>
                    {detailLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : detailData ? (
                        <Box>
                            <Typography variant='subtitle1' gutterBottom>
                                <strong>测试输入：</strong>
                                {detailData.testInput}
                            </Typography>
                            <ResultsTable results={detailData.results} />
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailOpen(false)}>关闭</Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    )
}

export default ModelEvaluation
