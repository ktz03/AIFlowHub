import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Typography,
    Alert,
    Card,
    CardContent,
    CardActions,
    Chip,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress
} from '@mui/material'
import { IconSparkles, IconCheck } from '@tabler/icons-react'

// API
import workflowGeneratorApi from '@/api/workflowGenerator'

const WorkflowGeneratorDialog = ({ show, onCancel, onConfirm }) => {
    const [description, setDescription] = useState('')
    const [mode, setMode] = useState('direct')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleGenerate = async () => {
        if (!description.trim()) {
            setError('请输入工作流描述')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            // 从系统配置读取 API Key
            const response = await workflowGeneratorApi.generateWorkflow({
                description,
                mode
            })

            setResult(response.data)
        } catch (err) {
            console.error('生成工作流失败:', err)
            const errorMsg = err.response?.data?.message || '生成工作流失败，请重试'

            if (errorMsg.includes('API Key') || errorMsg.includes('未配置')) {
                setError('系统未配置 API Key，请联系管理员在系统配置中设置')
            } else {
                setError(errorMsg)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleUseTemplate = (template) => {
        if (onConfirm && template) {
            onConfirm(template)
        }
    }

    const handleUseGeneratedWorkflow = () => {
        if (onConfirm && result?.generatedWorkflow) {
            onConfirm({
                type: 'generated',
                workflow: result.generatedWorkflow,
                explanation: result.explanation
            })
        }
    }

    const handleClose = () => {
        setDescription('')
        setResult(null)
        setError(null)
        onCancel()
    }

    return (
        <Dialog open={show} onClose={handleClose} maxWidth='md' fullWidth>
            <DialogTitle>
                <Stack direction='row' alignItems='center' spacing={1}>
                    <IconSparkles size={24} />
                    <Typography variant='h4'>AI 工作流生成器</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* 生成模式选择 - 默认并固定为直接生成 */}
                    <FormControl fullWidth>
                        <InputLabel>生成模式</InputLabel>
                        <Select value={mode} label='生成模式' onChange={(e) => setMode(e.target.value)} disabled={loading}>
                            <MenuItem value='direct'>直接生成（AI 创建新工作流）</MenuItem>
                        </Select>
                    </FormControl>

                    {/* 描述输入 */}
                    <TextField
                        label='描述你想要的工作流'
                        placeholder='例如：创建一个客服机器人，能够回答产品相关问题...'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={loading}
                    />

                    {/* 加载状态 */}
                    {loading && (
                        <Box>
                            <LinearProgress />
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                正在使用 AI 生成工作流...
                            </Typography>
                        </Box>
                    )}

                    {/* 错误提示 */}
                    {error && <Alert severity='error'>{error}</Alert>}

                    {/* 生成结果 */}
                    {result && (
                        <Stack spacing={2}>
                            {/* 意图分析 */}
                            <Card variant='outlined'>
                                <CardContent>
                                    <Typography variant='h6' gutterBottom>
                                        识别的意图
                                    </Typography>
                                    <Stack direction='row' spacing={1} alignItems='center' mb={1}>
                                        <Chip label={result.intent.category} color='primary' size='small' />
                                        <Typography variant='body2' color='text.secondary'>
                                            置信度: {(result.intent.confidence * 100).toFixed(0)}%
                                        </Typography>
                                    </Stack>
                                    {result.intent.requirements.length > 0 && (
                                        <>
                                            <Typography variant='subtitle2' gutterBottom>
                                                功能需求:
                                            </Typography>
                                            <Stack direction='row' spacing={0.5} flexWrap='wrap' gap={0.5}>
                                                {result.intent.requirements.map((req, idx) => (
                                                    <Chip key={idx} label={req} size='small' variant='outlined' />
                                                ))}
                                            </Stack>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 生成的工作流 */}
                            {result.generatedWorkflow && (
                                <Card variant='outlined'>
                                    <CardContent>
                                        <Typography variant='h6' gutterBottom>
                                            生成的工作流
                                        </Typography>
                                        {result.explanation && (
                                            <Typography variant='body2' color='text.secondary' mb={2}>
                                                {result.explanation}
                                            </Typography>
                                        )}
                                        <Stack direction='row' spacing={1} mb={1}>
                                            <Chip label={`${result.generatedWorkflow.nodes?.length || 0} 个节点`} size='small' />
                                            <Chip label={`${result.generatedWorkflow.edges?.length || 0} 个连接`} size='small' />
                                            {result.confidence && (
                                                <Chip
                                                    label={`置信度: ${(result.confidence * 100).toFixed(0)}%`}
                                                    color={result.confidence >= 0.8 ? 'success' : 'warning'}
                                                    size='small'
                                                />
                                            )}
                                        </Stack>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size='small'
                                            variant='contained'
                                            startIcon={<IconCheck size={18} />}
                                            onClick={handleUseGeneratedWorkflow}
                                        >
                                            使用此工作流
                                        </Button>
                                    </CardActions>
                                </Card>
                            )}

                            {/* 匹配的模板 */}
                            {result.matches && result.matches.length > 0 && !result.generatedWorkflow && (
                                <>
                                    <Typography variant='h6'>匹配的模板</Typography>
                                    {result.matches.map((match) => (
                                        <Card key={match.templateId} variant='outlined'>
                                            <CardContent>
                                                <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={1}>
                                                    <Typography variant='h6'>{match.name}</Typography>
                                                    <Chip
                                                        label={`${(match.similarity * 100).toFixed(0)}% 匹配`}
                                                        color='success'
                                                        size='small'
                                                    />
                                                </Stack>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {match.description}
                                                </Typography>
                                            </CardContent>
                                            <CardActions>
                                                <Button
                                                    size='small'
                                                    variant='contained'
                                                    startIcon={<IconCheck size={18} />}
                                                    onClick={() => handleUseTemplate(match)}
                                                >
                                                    使用此模板
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    ))}
                                </>
                            )}

                            {/* 无匹配结果 */}
                            {result.matches && result.matches.length === 0 && !result.generatedWorkflow && (
                                <Alert severity='info'>未找到完全匹配的模板，建议切换到「直接生成」模式让 AI 创建新工作流。</Alert>
                            )}
                        </Stack>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                {!result && (
                    <Button variant='contained' onClick={handleGenerate} disabled={loading || !description.trim()}>
                        {loading ? '生成中...' : '生成工作流'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

WorkflowGeneratorDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
}

export default WorkflowGeneratorDialog
