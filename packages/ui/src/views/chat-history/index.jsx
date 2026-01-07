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
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
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
    IconRobot
} from '@tabler/icons-react'

// 统计卡片组件
const StatCard = ({ title, value, icon: Icon, color, loading }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                    <Box>
                        <Typography variant='body2' color='text.secondary' gutterBottom>
                            {title}
                        </Typography>
                        {loading ? (
                            <Skeleton variant='text' width={60} height={40} />
                        ) : (
                            <Typography variant='h4' fontWeight='bold'>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${color}.lighter`,
                            color: `${color}.main`
                        }}
                    >
                        <Icon size={24} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    )
}

// 消息气泡组件
const MessageBubble = ({ message }) => {
    const theme = useTheme()
    const isUser = message.role === 'userMessage'

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2
            }}
        >
            <Paper
                sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
                    color: isUser ? 'white' : 'inherit',
                    borderRadius: 2
                }}
            >
                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {message.content}
                </Typography>
                <Typography variant='caption' sx={{ opacity: 0.7, display: 'block', mt: 1, textAlign: 'right' }}>
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
                                                            sx={{ pr: 12 }}
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
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant='body2' noWrap fontWeight={500}>
                                                                        {session.sessionTitle}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Stack spacing={0.5}>
                                                                        <Typography variant='caption' color='text.secondary' noWrap>
                                                                            {session.lastMessage}
                                                                        </Typography>
                                                                        <Stack direction='row' spacing={1} alignItems='center'>
                                                                            <Chip
                                                                                label={session.chatflowName}
                                                                                size='small'
                                                                                variant='outlined'
                                                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                                            />
                                                                            <Typography variant='caption' color='text.secondary'>
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
                                            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
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
                        autoFocus
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
