/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { useTranslation } from 'react-i18next'
import moment from 'moment'

// material-ui
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'

// API
import chatHistoryApi from '@/api/chatHistory'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'

// Const
import { baseURL } from '@/store/constant'

// Icons
import {
    IconMessage,
    IconSearch,
    IconTrash,
    IconDownload,
    IconEdit,
    IconX,
    IconCheck,
    IconMessages,
    IconCalendar,
    IconRobot,
    IconMessageCircle
} from '@tabler/icons-react'

// 统计卡片组件 - 优化版
const StatCard = ({ title, value, icon: Icon, color, loading }) => {
    const theme = useTheme()

    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette[color]?.lighter || theme.palette.background.paper} 0%, ${
                    theme.palette.background.paper
                } 100%)`,
                border: `1px solid ${theme.palette[color]?.light || theme.palette.divider}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px -10px ${theme.palette[color]?.main || theme.palette.primary.main}40`
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
                    <Box flex={1}>
                        <Typography
                            variant='caption'
                            color='text.secondary'
                            gutterBottom
                            sx={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                            }}
                        >
                            {title}
                        </Typography>
                        {loading ? (
                            <Skeleton variant='text' width={80} height={48} />
                        ) : (
                            <Typography
                                variant='h3'
                                fontWeight='700'
                                sx={{
                                    background: `linear-gradient(135deg, ${theme.palette[color]?.main || theme.palette.primary.main}, ${
                                        theme.palette[color]?.dark || theme.palette.primary.dark
                                    })`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${theme.palette[color]?.main || theme.palette.primary.main}, ${
                                theme.palette[color]?.dark || theme.palette.primary.dark
                            })`,
                            color: 'white',
                            boxShadow: `0 8px 16px -4px ${theme.palette[color]?.main || theme.palette.primary.main}60`,
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'rotate(10deg) scale(1.1)'
                            }
                        }}
                    >
                        <Icon size={28} strokeWidth={2} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}

// 消息气泡组件 - 优化版（支持图片显示）
const MessageBubble = ({ message, chatflowId, chatId }) => {
    const theme = useTheme()
    const isUser = message.role === 'userMessage'

    // 解析artifacts（如果有）
    let artifacts = []
    if (message.artifacts) {
        try {
            artifacts = typeof message.artifacts === 'string' ? JSON.parse(message.artifacts) : message.artifacts
            // 处理图片URL
            artifacts = artifacts.map((artifact) => {
                if ((artifact.type === 'png' || artifact.type === 'jpeg' || artifact.type === 'webp') && artifact.data) {
                    if (artifact.data.startsWith('FILE-STORAGE::')) {
                        const fileName = artifact.data.replace('FILE-STORAGE::', '')
                        return {
                            ...artifact,
                            data: `${baseURL}/api/v1/get-upload-file?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}`
                        }
                    }
                }
                return artifact
            })
        } catch (e) {
            console.error('Failed to parse artifacts:', e)
        }
    }

    // 从content中提取Markdown图片链接
    const extractMarkdownImages = (content) => {
        if (!content) return []
        // 匹配 ![alt](url) 格式的Markdown图片
        const regex = /!\[([^\]]*)\]\(([^)]+)\)/g
        const images = []
        let match
        while ((match = regex.exec(content)) !== null) {
            images.push({
                alt: match[1] || '图片',
                url: match[2]
            })
        }
        return images
    }

    const markdownImages = extractMarkdownImages(message.content)

    // 从content中移除Markdown图片语法，只保留文本
    const contentWithoutImages = message.content ? message.content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim() : ''

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2.5,
                animation: 'fadeInUp 0.4s ease-out',
                '@keyframes fadeInUp': {
                    from: {
                        opacity: 0,
                        transform: 'translateY(10px)'
                    },
                    to: {
                        opacity: 1,
                        transform: 'translateY(0)'
                    }
                }
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    maxWidth: '75%',
                    background: isUser
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        : theme.palette.mode === 'dark'
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    color: isUser ? 'white' : 'inherit',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
                    boxShadow: isUser ? `0 4px 12px -2px ${theme.palette.primary.main}40` : '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isUser ? `0 8px 20px -4px ${theme.palette.primary.main}50` : '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&::before': isUser
                        ? {
                              content: '""',
                              position: 'absolute',
                              right: -6,
                              bottom: 8,
                              width: 0,
                              height: 0,
                              borderLeft: `8px solid ${theme.palette.primary.dark}`,
                              borderTop: '8px solid transparent',
                              borderBottom: '8px solid transparent'
                          }
                        : {
                              content: '""',
                              position: 'absolute',
                              left: -6,
                              bottom: 8,
                              width: 0,
                              height: 0,
                              borderRight: `8px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50]}`,
                              borderTop: '8px solid transparent',
                              borderBottom: '8px solid transparent'
                          }
                }}
            >
                <Typography
                    variant='body1'
                    sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                    }}
                >
                    {contentWithoutImages || message.content}
                </Typography>

                {/* 显示从content中提取的Markdown图片 */}
                {markdownImages.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {markdownImages.map((img, index) => (
                            <Card
                                key={`markdown-${index}`}
                                sx={{
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.02)'
                                    }
                                }}
                            >
                                <CardMedia
                                    component='img'
                                    image={img.url}
                                    alt={img.alt}
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: 400,
                                        objectFit: 'contain',
                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        console.error('Failed to load markdown image:', img.url)
                                    }}
                                />
                            </Card>
                        ))}
                    </Box>
                )}

                {/* 显示图片artifacts */}
                {artifacts.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {artifacts.map((artifact, index) => {
                            if (artifact.type === 'png' || artifact.type === 'jpeg' || artifact.type === 'webp') {
                                return (
                                    <Card
                                        key={index}
                                        sx={{
                                            overflow: 'hidden',
                                            borderRadius: 2,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            transition: 'transform 0.2s ease',
                                            '&:hover': {
                                                transform: 'scale(1.02)'
                                            }
                                        }}
                                    >
                                        <CardMedia
                                            component='img'
                                            image={artifact.data}
                                            alt={artifact.title || '生成的图片'}
                                            sx={{
                                                width: '100%',
                                                height: 'auto',
                                                maxHeight: 400,
                                                objectFit: 'contain',
                                                backgroundColor:
                                                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none'
                                                console.error('Failed to load image:', artifact.data)
                                            }}
                                        />
                                    </Card>
                                )
                            }
                            return null
                        })}
                    </Box>
                )}

                <Typography
                    variant='caption'
                    sx={{
                        opacity: isUser ? 0.9 : 0.6,
                        display: 'block',
                        mt: 1.5,
                        textAlign: 'right',
                        fontSize: '0.75rem',
                        fontWeight: 500
                    }}
                >
                    {moment(message.createdDate).format('HH:mm:ss')}
                </Typography>
            </Paper>
        </Box>
    )
}

// 主组件
const ChatHistory = () => {
    const theme = useTheme()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // 状态
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sessions, setSessions] = useState([])
    const [sessionsTotal, setSessionsTotal] = useState(0)
    const [stats, setStats] = useState({})
    const [selectedSession, setSelectedSession] = useState(null)
    const [messages, setMessages] = useState([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [searchKeyword, setSearchKeyword] = useState('')
    const [selectedSessions, setSelectedSessions] = useState([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingTitle, setEditingTitle] = useState(null)
    const [newTitle, setNewTitle] = useState('')

    // API hooks
    const sessionsApi = useApi(chatHistoryApi.getSessions)
    const statsApi = useApi(chatHistoryApi.getStats)

    // 加载会话列表
    const loadSessions = useCallback((search = '') => {
        sessionsApi.request({ page: 1, limit: 50, search })
    }, [])

    // 加载统计信息
    const loadStats = useCallback(() => {
        statsApi.request()
    }, [])

    useEffect(() => {
        loadSessions()
        loadStats()
    }, [])

    // 处理API响应
    useEffect(() => {
        if (sessionsApi.data?.data) {
            setSessions(sessionsApi.data.data.sessions || [])
            setSessionsTotal(sessionsApi.data.data.total || 0)
        }
        setLoading(sessionsApi.loading)
    }, [sessionsApi.data, sessionsApi.loading])

    useEffect(() => {
        if (statsApi.data?.data) {
            setStats(statsApi.data.data)
        }
    }, [statsApi.data])

    useEffect(() => {
        if (sessionsApi.error) setError(sessionsApi.error)
    }, [sessionsApi.error])

    // 加载会话消息
    const loadMessages = async (sessionId) => {
        setMessagesLoading(true)
        try {
            const response = await chatHistoryApi.getSessionMessages(sessionId, { page: 1, limit: 100 })
            setMessages(response.data?.data?.messages || [])
        } catch (err) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${err.message}`,
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
            setMessagesLoading(false)
        }
    }

    // 选择会话
    const handleSelectSession = (session) => {
        setSelectedSession(session)
        loadMessages(session.sessionId)
    }

    // 搜索
    const handleSearch = () => {
        loadSessions(searchKeyword)
    }

    // 删除会话
    const handleDeleteSession = async () => {
        try {
            if (selectedSessions.length > 0) {
                await chatHistoryApi.deleteSessions(selectedSessions)
            } else if (selectedSession) {
                await chatHistoryApi.deleteSession(selectedSession.sessionId)
            }
            setDeleteDialogOpen(false)
            setSelectedSessions([])
            setSelectedSession(null)
            setMessages([])
            loadSessions(searchKeyword)
            loadStats()
            enqueueSnackbar({
                message: t('history.deleteSuccess'),
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
        } catch (err) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${err.message}`,
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

    // 导出会话
    const handleExportSession = async (session) => {
        try {
            const response = await chatHistoryApi.exportSession(session.sessionId)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `chat-${session.sessionId.substring(0, 8)}-${moment().format('YYYY-MM-DD')}.md`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            enqueueSnackbar({
                message: t('history.exportSuccess'),
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
        } catch (err) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${err.message}`,
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

    // 继续聊天 - 跳转到对应的工作流
    const handleContinueChat = (session) => {
        // 跳转到工作流页面，并传递sessionId以继续对话
        navigate(`/canvas/${session.chatflowId}`, {
            state: {
                sessionId: session.sessionId,
                continueChat: true
            }
        })
    }

    // 更新会话标题
    const handleUpdateTitle = async () => {
        if (!editingTitle || !newTitle.trim()) return
        try {
            await chatHistoryApi.updateSessionTitle(editingTitle, newTitle.trim())
            setEditingTitle(null)
            setNewTitle('')
            loadSessions(searchKeyword)
            enqueueSnackbar({
                message: t('history.titleUpdated'),
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
        } catch (err) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${err.message}`,
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

    // 切换选择
    const handleToggleSelect = (sessionId) => {
        setSelectedSessions((prev) => (prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]))
    }

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader titleKey='history.title'>
                            <Stack direction='row' spacing={2} alignItems='center'>
                                <TextField
                                    size='small'
                                    placeholder={t('history.searchPlaceholder')}
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <IconSearch size={18} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ width: 250 }}
                                />
                                <Button variant='outlined' onClick={handleSearch}>
                                    {t('common.search')}
                                </Button>
                                {selectedSessions.length > 0 && (
                                    <Button
                                        variant='outlined'
                                        color='error'
                                        startIcon={<IconTrash />}
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        {t('history.deleteSelected')} ({selectedSessions.length})
                                    </Button>
                                )}
                            </Stack>
                        </ViewHeader>

                        {/* 统计卡片 */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title={t('history.totalSessions')}
                                    value={stats.totalSessions || 0}
                                    icon={IconMessages}
                                    color='primary'
                                    loading={statsApi.loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title={t('history.totalMessages')}
                                    value={stats.totalMessages || 0}
                                    icon={IconMessage}
                                    color='secondary'
                                    loading={statsApi.loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatCard
                                    title={t('history.recentSessions')}
                                    value={stats.recentSessions || 0}
                                    icon={IconCalendar}
                                    color='success'
                                    loading={statsApi.loading}
                                />
                            </Grid>
                        </Grid>

                        {/* 主内容区 */}
                        <Grid container spacing={3}>
                            {/* 会话列表 */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: 500, overflow: 'auto' }}>
                                    <CardContent sx={{ p: 0 }}>
                                        <Typography variant='h6' sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            {t('history.sessionList')} ({sessionsTotal})
                                        </Typography>
                                        {isLoading ? (
                                            <Box sx={{ p: 2 }}>
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <Skeleton key={i} variant='rectangular' height={60} sx={{ mb: 1, borderRadius: 1 }} />
                                                ))}
                                            </Box>
                                        ) : sessions.length > 0 ? (
                                            <List disablePadding>
                                                {sessions.map((session) => (
                                                    <ListItem
                                                        key={session.sessionId}
                                                        disablePadding
                                                        secondaryAction={
                                                            <Stack direction='row' spacing={0.5}>
                                                                <Tooltip title='继续聊天'>
                                                                    <IconButton
                                                                        size='small'
                                                                        color='primary'
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleContinueChat(session)
                                                                        }}
                                                                    >
                                                                        <IconMessageCircle size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title={t('history.editTitle')}>
                                                                    <IconButton
                                                                        size='small'
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setEditingTitle(session.sessionId)
                                                                            setNewTitle(session.sessionTitle)
                                                                        }}
                                                                    >
                                                                        <IconEdit size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title={t('history.export')}>
                                                                    <IconButton
                                                                        size='small'
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleExportSession(session)
                                                                        }}
                                                                    >
                                                                        <IconDownload size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title={t('common.delete')}>
                                                                    <IconButton
                                                                        size='small'
                                                                        color='error'
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setSelectedSession(session)
                                                                            setDeleteDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        <IconTrash size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        }
                                                    >
                                                        <ListItemButton
                                                            selected={selectedSession?.sessionId === session.sessionId}
                                                            onClick={() => handleSelectSession(session)}
                                                            sx={{
                                                                pr: 16, // 增加右侧padding以容纳4个按钮
                                                                borderRadius: 1,
                                                                mx: 1,
                                                                mb: 0.5,
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    backgroundColor:
                                                                        theme.palette.mode === 'dark'
                                                                            ? 'rgba(255,255,255,0.08)'
                                                                            : 'rgba(0,0,0,0.04)',
                                                                    transform: 'translateX(4px)'
                                                                },
                                                                '&.Mui-selected': {
                                                                    backgroundColor:
                                                                        theme.palette.mode === 'dark'
                                                                            ? 'rgba(144,202,249,0.16)'
                                                                            : 'rgba(25,118,210,0.08)',
                                                                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                                                                    '&:hover': {
                                                                        backgroundColor:
                                                                            theme.palette.mode === 'dark'
                                                                                ? 'rgba(144,202,249,0.24)'
                                                                                : 'rgba(25,118,210,0.12)'
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                <Checkbox
                                                                    edge='start'
                                                                    checked={selectedSessions.includes(session.sessionId)}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleToggleSelect(session.sessionId)
                                                                    }}
                                                                    size='small'
                                                                    sx={{
                                                                        '&.Mui-checked': {
                                                                            color: theme.palette.primary.main
                                                                        }
                                                                    }}
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography
                                                                        variant='body2'
                                                                        noWrap
                                                                        fontWeight={
                                                                            selectedSession?.sessionId === session.sessionId ? 600 : 500
                                                                        }
                                                                        sx={{
                                                                            color:
                                                                                selectedSession?.sessionId === session.sessionId
                                                                                    ? theme.palette.primary.main
                                                                                    : 'inherit'
                                                                        }}
                                                                    >
                                                                        {session.sessionTitle}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                                        <Typography
                                                                            variant='caption'
                                                                            color='text.secondary'
                                                                            noWrap
                                                                            sx={{
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                                maxWidth: '100%'
                                                                            }}
                                                                        >
                                                                            {session.lastMessage
                                                                                ? `${session.lastMessage.substring(0, 4)}...`
                                                                                : ''}
                                                                        </Typography>
                                                                        <Stack
                                                                            direction='row'
                                                                            spacing={1}
                                                                            alignItems='center'
                                                                            flexWrap='wrap'
                                                                        >
                                                                            <Chip
                                                                                label={session.chatflowName}
                                                                                size='small'
                                                                                variant='outlined'
                                                                                sx={{
                                                                                    height: 20,
                                                                                    fontSize: '0.7rem',
                                                                                    borderColor: theme.palette.primary.main,
                                                                                    color: theme.palette.primary.main,
                                                                                    fontWeight: 500
                                                                                }}
                                                                            />
                                                                            <Typography
                                                                                variant='caption'
                                                                                color='text.secondary'
                                                                                sx={{ fontSize: '0.7rem' }}
                                                                            >
                                                                                {moment(session.lastMessageTime).fromNow()}
                                                                            </Typography>
                                                                        </Stack>
                                                                    </Stack>
                                                                }
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                                <IconMessages size={48} color={theme.palette.grey[400]} />
                                                <Typography color='text.secondary' sx={{ mt: 2 }}>
                                                    {t('history.noSessions')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 消息详情 */}
                            <Grid item xs={12} md={8}>
                                <Card sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                                        {selectedSession ? (
                                            <Stack direction='row' alignItems='center' justifyContent='space-between'>
                                                <Box>
                                                    <Typography variant='h6'>{selectedSession.sessionTitle}</Typography>
                                                    <Stack direction='row' spacing={1} alignItems='center'>
                                                        <IconRobot size={14} />
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {selectedSession.chatflowName}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            · {selectedSession.messageCount} {t('history.messages')}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                                <Button
                                                    variant='outlined'
                                                    size='small'
                                                    startIcon={<IconDownload />}
                                                    onClick={() => handleExportSession(selectedSession)}
                                                >
                                                    {t('history.export')}
                                                </Button>
                                            </Stack>
                                        ) : (
                                            <Typography variant='h6' color='text.secondary'>
                                                {t('history.selectSession')}
                                            </Typography>
                                        )}
                                    </CardContent>
                                    <CardContent sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                                        {messagesLoading ? (
                                            <Box>
                                                {[1, 2, 3].map((i) => (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
                                                            mb: 2
                                                        }}
                                                    >
                                                        <Skeleton variant='rectangular' width='60%' height={60} sx={{ borderRadius: 2 }} />
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : messages.length > 0 ? (
                                            messages.map((msg) => (
                                                <MessageBubble
                                                    key={msg.id}
                                                    message={msg}
                                                    chatflowId={selectedSession.chatflowId}
                                                    chatId={selectedSession.sessionId}
                                                />
                                            ))
                                        ) : selectedSession ? (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color='text.secondary'>{t('history.noMessages')}</Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                                <IconMessage size={64} color={theme.palette.grey[300]} />
                                                <Typography color='text.secondary' sx={{ mt: 2 }}>
                                                    {t('history.selectSessionHint')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Stack>
                )}
            </MainCard>

            {/* 删除确认对话框 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('history.deleteTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {selectedSessions.length > 0
                            ? t('history.deleteMultipleConfirm', { count: selectedSessions.length })
                            : t('history.deleteConfirm')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleDeleteSession} color='error' variant='contained'>
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 编辑标题对话框 */}
            <Dialog open={!!editingTitle} onClose={() => setEditingTitle(null)}>
                <DialogTitle>{t('history.editTitle')}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin='dense'
                        label={t('history.sessionTitle')}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingTitle(null)}>{t('common.cancel')}</Button>
                    <Button onClick={handleUpdateTitle} variant='contained' startIcon={<IconCheck />}>
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default ChatHistory
