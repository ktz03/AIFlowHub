import { useState, useEffect } from 'react'
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
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material'
import { IconSettings, IconRefresh, IconCheck, IconX } from '@tabler/icons-react'
import systemConfigApi from '@/api/systemConfig'

const WorkflowGeneratorManagementDialog = ({ show, onCancel }) => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [configStatus, setConfigStatus] = useState(null)

    // 配置状态
    const [apiKey, setApiKey] = useState('')
    const [model, setModel] = useState('deepseek-chat')
    const [showApiKey, setShowApiKey] = useState(false)

    // 加载配置状态
    useEffect(() => {
        if (show) {
            loadConfigStatus()
        }
    }, [show])

    const loadConfigStatus = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await systemConfigApi.checkWorkflowGeneratorConfig()
            setConfigStatus(response.data)
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
            await systemConfigApi.setWorkflowGeneratorApiKey(apiKey, model)
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

    const handleClose = () => {
        setApiKey('')
        setError(null)
        setSuccess(null)
        setShowApiKey(false)
        onCancel()
    }

    return (
        <Dialog open={show} onClose={handleClose} maxWidth='sm' fullWidth>
            <DialogTitle>
                <Stack direction='row' alignItems='center' spacing={1}>
                    <IconSettings size={24} />
                    <Typography variant='h5'>工作流生成器管理</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* 当前状态 */}
                    <Box>
                        <Stack direction='row' alignItems='center' justifyContent='space-between' mb={1}>
                            <Typography variant='subtitle2' color='text.secondary'>
                                当前状态
                            </Typography>
                            <Tooltip title='刷新状态'>
                                <IconButton size='small' onClick={loadConfigStatus} disabled={loading}>
                                    <IconRefresh size={18} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        {configStatus && (
                            <Alert
                                severity={configStatus.isConfigured ? 'success' : 'warning'}
                                icon={configStatus.isConfigured ? <IconCheck /> : <IconX />}
                            >
                                {configStatus.isConfigured
                                    ? `已配置 API Key，当前使用模型: ${configStatus.model}`
                                    : '未配置 API Key，用户将无法使用工作流生成功能'}
                            </Alert>
                        )}
                    </Box>

                    <Divider />

                    {/* 配置表单 */}
                    <Typography variant='h6'>更新配置</Typography>

                    {/* 错误提示 */}
                    {error && (
                        <Alert severity='error' onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* 成功提示 */}
                    {success && (
                        <Alert severity='success' onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    {/* API Key 输入 */}
                    <TextField
                        fullWidth
                        label='API Key'
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder='sk-...'
                        helperText='输入新的 DeepSeek API Key（将加密存储）'
                        InputProps={{
                            endAdornment: (
                                <Tooltip title={showApiKey ? '隐藏' : '显示'}>
                                    <IconButton size='small' onClick={() => setShowApiKey(!showApiKey)}>
                                        {showApiKey ? <IconX size={18} /> : <IconCheck size={18} />}
                                    </IconButton>
                                </Tooltip>
                            )
                        }}
                    />

                    {/* 模型选择 */}
                    <FormControl fullWidth>
                        <InputLabel>模型</InputLabel>
                        <Select value={model} onChange={(e) => setModel(e.target.value)} label='模型'>
                            <MenuItem value='deepseek-chat'>deepseek-chat（推荐）</MenuItem>
                            <MenuItem value='deepseek-coder'>deepseek-coder</MenuItem>
                        </Select>
                    </FormControl>

                    {/* 说明 */}
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant='subtitle2' gutterBottom>
                            📌 说明:
                        </Typography>
                        <Typography variant='body2' component='div'>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                <li>此 API Key 仅用于工作流生成功能</li>
                                <li>用户无需配置即可免费使用</li>
                                <li>API Key 将加密存储在数据库中</li>
                                <li>建议定期更换以确保安全</li>
                            </ul>
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>关闭</Button>
                <Button variant='contained' color='primary' onClick={handleSave} disabled={saving || !apiKey.trim()}>
                    {saving ? '保存中...' : '保存配置'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

WorkflowGeneratorManagementDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func
}

export default WorkflowGeneratorManagementDialog
