import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Chip
} from '@mui/material'
import { useSelector } from 'react-redux'
import systemConfigApi from '@/api/systemConfig'

// 模型提供商配置（基于 GitHub 官方仓库最新信息 - 2026年1月）
const MODEL_PROVIDERS = {
    deepseek: {
        name: 'DeepSeek',
        models: [
            { value: 'deepseek-chat', label: 'DeepSeek-Chat', description: 'DeepSeek-V3 对话模型，671B 参数，性能卓越' },
            { value: 'deepseek-coder', label: 'DeepSeek-Coder', description: '代码专用模型，编程能力强' },
            { value: 'deepseek-reasoner', label: 'DeepSeek-R1', description: 'DeepSeek-R1 推理模型，深度思考能力' }
        ],
        docUrl: 'https://platform.deepseek.com/api-docs/',
        apiKeyPlaceholder: 'sk-...',
        color: '#1976d2'
    },
    openai: {
        name: 'OpenAI',
        models: [
            { value: 'gpt-4.5-preview', label: 'GPT-4.5 Preview', description: 'GPT-4.5 预览版，最新实验性模型' },
            { value: 'o3-mini', label: 'o3-mini', description: '最新推理模型，高效且强大' },
            { value: 'o1', label: 'o1', description: '最新 o1 推理模型' },
            { value: 'o1-preview', label: 'o1-preview', description: 'o1 预览版推理模型' },
            { value: 'o1-mini', label: 'o1-mini', description: 'o1 轻量级推理模型' },
            { value: 'gpt-4o', label: 'GPT-4o', description: '最新多模态模型，性能卓越' },
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: '轻量级 GPT-4o，快速且经济' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'GPT-4 增强版，性能强大' },
            { value: 'gpt-4', label: 'GPT-4', description: '经典 GPT-4 模型' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: '快速且经济的模型' }
        ],
        docUrl: 'https://platform.openai.com/docs/api-reference',
        apiKeyPlaceholder: 'sk-...',
        color: '#10a37f'
    },
    anthropic: {
        name: 'Anthropic',
        models: [
            { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet (Latest)', description: '最新 Claude 3.7 Sonnet，混合推理模型' },
            { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Latest)', description: '最新 Claude 3.5 Sonnet，最智能模型' },
            { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Latest)', description: '最新 Claude 3.5 Haiku，最快模型' },
            { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (20241022)', description: 'Claude 3.5 Sonnet 特定版本' },
            { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (20241022)', description: 'Claude 3.5 Haiku 特定版本' },
            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: '最强大的 Claude 3 模型' },
            { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: '平衡性能与成本' },
            { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: '快速响应模型' }
        ],
        docUrl: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
        apiKeyPlaceholder: 'sk-ant-...',
        color: '#d97757'
    },
    google: {
        name: 'Google',
        models: [
            { value: 'gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', description: '最新 Gemini 2.0 Flash，速度快' },
            { value: 'gemini-2.0-flash-lite-001', label: 'Gemini 2.0 Flash Lite', description: 'Gemini 2.0 轻量版' },
            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Gemini 1.5 Pro，性能强大' },
            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Gemini 1.5 Flash，快速响应' },
            { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', description: 'Gemini 1.5 Flash 8B 轻量版' }
        ],
        docUrl: 'https://ai.google.dev/docs',
        apiKeyPlaceholder: 'AIza...',
        color: '#4285f4'
    },
    zhipuai: {
        name: '智谱 AI',
        models: [
            { value: 'glm-4-plus', label: 'GLM-4 Plus', description: '增强版 GLM-4，能力更强' },
            { value: 'glm-4-air', label: 'GLM-4 Air', description: '轻量级 GLM-4，快速响应' },
            { value: 'glm-4-airx', label: 'GLM-4 AirX', description: 'GLM-4 AirX，性能优化版' },
            { value: 'glm-4-flash', label: 'GLM-4 Flash', description: '超快响应，性价比极高' },
            { value: 'glm-4-long', label: 'GLM-4 Long', description: '超长上下文模型' },
            { value: 'glm-4-0520', label: 'GLM-4-0520', description: 'GLM-4 特定版本' },
            { value: 'glm-4', label: 'GLM-4', description: 'GLM-4 基础模型' },
            { value: 'glm-3-turbo', label: 'GLM-3 Turbo', description: 'GLM-3 快速版本' }
        ],
        docUrl: 'https://open.bigmodel.cn/dev/api',
        apiKeyPlaceholder: '请输入智谱 AI API Key',
        color: '#722ed1'
    },
    moonshot: {
        name: 'Moonshot AI',
        models: [
            { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K', description: '8K 上下文窗口' },
            { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K', description: '32K 上下文窗口' },
            { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K', description: '128K 超长上下文' }
        ],
        docUrl: 'https://platform.moonshot.cn/docs',
        apiKeyPlaceholder: 'sk-...',
        color: '#eb2f96'
    }
}

const SystemConfig = () => {
    const navigate = useNavigate()
    const user = useSelector((state) => state.user)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [configStatus, setConfigStatus] = useState(null)

    // 工作流生成器配置
    const [provider, setProvider] = useState('deepseek')
    const [apiKey, setApiKey] = useState('')
    const [model, setModel] = useState('deepseek-chat')

    // 检查是否是管理员
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/')
        }
    }, [user, navigate])

    // 加载配置状态
    useEffect(() => {
        loadConfigStatus()
    }, [])

    // 当提供商改变时，重置模型为该提供商的第一个模型
    useEffect(() => {
        if (MODEL_PROVIDERS[provider]?.models?.length > 0) {
            setModel(MODEL_PROVIDERS[provider].models[0].value)
        }
    }, [provider])

    const loadConfigStatus = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await systemConfigApi.checkWorkflowGeneratorConfig()
            setConfigStatus(response.data)
            if (response.data.provider) {
                setProvider(response.data.provider)
            }
            if (response.data.model) {
                setModel(response.data.model)
            }
        } catch (err) {
            console.error('加载配置状态失败:', err)
            setError(err.response?.data?.message || '加载配置失败')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setError('请输入 API Key')
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            await systemConfigApi.setWorkflowGeneratorApiKey(apiKey, model, provider)
            setSuccess('配置已保存成功')
            setApiKey('') // 清空输入框
            await loadConfigStatus() // 重新加载状态
        } catch (err) {
            console.error('保存配置失败:', err)
            setError(err.response?.data?.message || '保存配置失败')
        } finally {
            setSaving(false)
        }
    }

    const currentProvider = MODEL_PROVIDERS[provider]
    const currentModel = currentProvider?.models?.find((m) => m.value === model)

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant='h4' gutterBottom sx={{ fontWeight: 600 }}>
                    系统配置
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                    管理员专用 - 配置系统级别的 AI 模型服务
                </Typography>
            </Box>

            {/* 工作流生成器配置 */}
            <Card sx={{ boxShadow: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Typography variant='h5' sx={{ fontWeight: 600, flex: 1 }}>
                            工作流生成器配置
                        </Typography>
                        {configStatus?.isConfigured && <Chip label='已配置' color='success' size='small' />}
                    </Box>

                    <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                        配置专用于工作流生成功能的 AI 模型服务，用户无法在其他地方使用此配置
                    </Typography>

                    {/* 当前状态 - 更直观的显示 */}
                    {configStatus && configStatus.isConfigured && (
                        <Card variant='outlined' sx={{ mb: 3, bgcolor: 'success.lighter', borderColor: 'success.main', borderWidth: 2 }}>
                            <CardContent>
                                <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                                    <Chip icon={<span>✓</span>} label='已配置' color='success' />
                                    <Typography variant='h6' color='success.dark'>
                                        工作流生成器已就绪
                                    </Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant='body2' color='text.secondary' sx={{ minWidth: 100 }}>
                                            AI 提供商:
                                        </Typography>
                                        <Chip
                                            label={MODEL_PROVIDERS[configStatus.provider]?.name || configStatus.provider}
                                            size='small'
                                            sx={{ bgcolor: MODEL_PROVIDERS[configStatus.provider]?.color, color: 'white' }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant='body2' color='text.secondary' sx={{ minWidth: 100 }}>
                                            使用模型:
                                        </Typography>
                                        <Typography variant='body2' fontWeight={600}>
                                            {configStatus.model}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant='body2' color='text.secondary' sx={{ minWidth: 100 }}>
                                            API Key:
                                        </Typography>
                                        <Typography variant='body2' fontFamily='monospace' color='success.dark'>
                                            ●●●●●●●●●●●● (已加密存储)
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Alert severity='info' sx={{ mt: 2 }}>
                                    如需更新配置，请在下方输入新的 API Key 并保存
                                </Alert>
                            </CardContent>
                        </Card>
                    )}

                    {configStatus && !configStatus.isConfigured && (
                        <Alert severity='warning' sx={{ mb: 3 }}>
                            <strong>未配置 API Key</strong>
                            <br />
                            工作流生成功能将无法使用，请在下方配置 AI 模型服务
                        </Alert>
                    )}

                    {/* 错误提示 */}
                    {error && (
                        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* 成功提示 */}
                    {success && (
                        <Alert severity='success' sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        {/* 提供商选择 */}
                        <FormControl fullWidth>
                            <InputLabel>模型提供商</InputLabel>
                            <Select value={provider} onChange={(e) => setProvider(e.target.value)} label='模型提供商'>
                                {Object.entries(MODEL_PROVIDERS).map(([key, config]) => (
                                    <MenuItem key={key} value={key}>
                                        {config.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* API Key 输入 */}
                        <TextField
                            fullWidth
                            label='API Key'
                            type='password'
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={currentProvider?.apiKeyPlaceholder}
                            helperText={`输入 ${currentProvider?.name} API Key（将加密存储）`}
                        />

                        {/* 模型选择 */}
                        <FormControl fullWidth>
                            <InputLabel>模型</InputLabel>
                            <Select value={model} onChange={(e) => setModel(e.target.value)} label='模型'>
                                {currentProvider?.models?.map((modelConfig) => (
                                    <MenuItem key={modelConfig.value} value={modelConfig.value}>
                                        <Box>
                                            <Typography variant='body1'>{modelConfig.label}</Typography>
                                            <Typography variant='caption' color='text.secondary'>
                                                {modelConfig.description}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {currentModel && (
                                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, ml: 2 }}>
                                    {currentModel.description}
                                </Typography>
                            )}
                        </FormControl>

                        {/* 保存按钮 */}
                        <Button variant='contained' color='primary' onClick={handleSave} disabled={saving || !apiKey.trim()} size='large'>
                            {saving ? <CircularProgress size={24} /> : '保存配置'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    )
}

export default SystemConfig
