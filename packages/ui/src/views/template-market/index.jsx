import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

// material-ui
import {
    Box,
    Stack,
    Card,
    CardContent,
    CardActions,
    Typography,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Rating,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Tooltip,
    Avatar,
    Pagination,
    Alert
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconSearch, IconHeart, IconHeartFilled, IconDownload, IconEye, IconStar, IconPlus, IconX, IconFilter } from '@tabler/icons-react'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { TabPanel } from '@/ui-component/tabs/TabPanel'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

// API
import templateMarketApi from '@/api/templateMarket'
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL, gridSpacing } from '@/store/constant'

// 分类图标映射
const categoryIcons = {
    chatbot: '🤖',
    rag: '📚',
    agent: '🦾',
    automation: '⚙️',
    'data-analysis': '📊',
    content: '✍️',
    translation: '🌐',
    code: '💻',
    education: '🎓',
    other: '📦'
}

// ==============================|| Template Market ||============================== //

const TemplateMarket = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const theme = useTheme()
    const { t } = useTranslation()
    const { user } = useSelector((state) => state.auth || {})

    // State
    const [activeTab, setActiveTab] = useState(0)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [sortBy, setSortBy] = useState('useCount')
    const [page, setPage] = useState(1)
    const [templates, setTemplates] = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([])
    const [categoryStats, setCategoryStats] = useState([])

    // Dialog state
    const [detailDialog, setDetailDialog] = useState({ open: false, template: null })
    const [shareDialog, setShareDialog] = useState({ open: false })
    const [chatflows, setChatflows] = useState([])

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // API hooks
    const getCategoriesApi = useApi(templateMarketApi.getCategories)
    const getCategoryStatsApi = useApi(templateMarketApi.getCategoryStats)

    // 加载分类
    useEffect(() => {
        getCategoriesApi.request()
        getCategoryStatsApi.request()
    }, [])

    useEffect(() => {
        if (getCategoriesApi.data) {
            setCategories(getCategoriesApi.data)
        }
    }, [getCategoriesApi.data])

    useEffect(() => {
        if (getCategoryStatsApi.data) {
            setCategoryStats(getCategoryStatsApi.data)
        }
    }, [getCategoryStatsApi.data])

    // 加载模板
    const loadTemplates = useCallback(async () => {
        setLoading(true)
        try {
            let response
            if (activeTab === 0) {
                // 公开模板
                response = await templateMarketApi.getPublicTemplates({
                    category: categoryFilter,
                    search,
                    page,
                    limit: 12,
                    sortBy,
                    sortOrder: 'DESC'
                })
            } else if (activeTab === 1) {
                // 我的模板
                response = await templateMarketApi.getUserTemplates({
                    category: categoryFilter,
                    search
                })
            } else {
                // 我的收藏
                response = await templateMarketApi.getUserFavorites()
            }

            if (response.data) {
                if (activeTab === 0) {
                    setTemplates(response.data.templates || [])
                    setTotalPages(response.data.totalPages || 1)
                } else {
                    setTemplates(Array.isArray(response.data) ? response.data : [])
                    setTotalPages(1)
                }
            }
        } catch (error) {
            console.error('Failed to load templates:', error)
            enqueueSnackbar({
                message: t('templateMarket.loadError') || '加载模板失败',
                options: { variant: 'error' }
            })
        } finally {
            setLoading(false)
        }
    }, [activeTab, categoryFilter, search, page, sortBy])

    useEffect(() => {
        loadTemplates()
    }, [loadTemplates])

    // 处理标签切换
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
        setPage(1)
    }

    // 处理收藏
    const handleToggleFavorite = async (templateId, e) => {
        e.stopPropagation()
        if (!user) {
            enqueueSnackbar({
                message: t('common.pleaseLogin') || '请先登录',
                options: { variant: 'warning' }
            })
            return
        }
        try {
            const response = await templateMarketApi.toggleFavorite(templateId)
            if (response.data) {
                setTemplates((prev) =>
                    prev.map((t) =>
                        t.id === templateId ? { ...t, isFavorited: response.data.favorited, likeCount: response.data.likeCount } : t
                    )
                )
                enqueueSnackbar({
                    message: response.data.favorited
                        ? t('templateMarket.favorited') || '已收藏'
                        : t('templateMarket.unfavorited') || '已取消收藏',
                    options: { variant: 'success' }
                })
            }
        } catch (error) {
            console.error('Toggle favorite failed:', error)
        }
    }

    // 使用模板
    const handleUseTemplate = async (template, e) => {
        e?.stopPropagation()
        try {
            const response = await templateMarketApi.useTemplate(template.id)
            if (response.data) {
                // 创建新的 chatflow
                const createResponse = await chatflowsApi.createNewChatflow({
                    name: `${template.name} - 副本`,
                    flowData: response.data.flowData,
                    type: response.data.type || 'CHATFLOW'
                })
                if (createResponse.data) {
                    enqueueSnackbar({
                        message: t('templateMarket.useSuccess') || '模板已导入',
                        options: { variant: 'success' }
                    })
                    navigate(`/canvas/${createResponse.data.id}`)
                }
            }
        } catch (error) {
            console.error('Use template failed:', error)
            enqueueSnackbar({
                message: t('templateMarket.useError') || '使用模板失败',
                options: { variant: 'error' }
            })
        }
    }

    // 查看详情
    const handleViewDetail = async (template) => {
        try {
            const response = await templateMarketApi.getTemplateById(template.id)
            if (response.data) {
                setDetailDialog({ open: true, template: response.data })
            }
        } catch (error) {
            console.error('Get template detail failed:', error)
        }
    }

    // 打开分享对话框
    const handleOpenShareDialog = async () => {
        try {
            const response = await chatflowsApi.getAllChatflows()
            if (response.data) {
                setChatflows(response.data)
                setShareDialog({ open: true })
            }
        } catch (error) {
            console.error('Get chatflows failed:', error)
        }
    }

    // 获取节点图标
    const getNodeIcons = (flowData) => {
        try {
            const data = typeof flowData === 'string' ? JSON.parse(flowData) : flowData
            const nodes = data?.nodes || []
            const icons = []
            for (const node of nodes.slice(0, 5)) {
                const iconUrl = `${baseURL}/api/v1/node-icon/${node.data?.name}`
                if (!icons.includes(iconUrl)) {
                    icons.push(iconUrl)
                }
            }
            return icons
        } catch {
            return []
        }
    }

    // 模板卡片组件
    const TemplateCard = ({ template }) => {
        const icons = getNodeIcons(template.flowData)

        return (
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                    }
                }}
                onClick={() => handleViewDetail(template)}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={1}>
                        <Typography variant='h5' component='div' noWrap sx={{ maxWidth: '80%' }}>
                            {categoryIcons[template.category] || '📦'} {template.name}
                        </Typography>
                        <IconButton
                            size='small'
                            onClick={(e) => handleToggleFavorite(template.id, e)}
                            color={template.isFavorited ? 'error' : 'default'}
                        >
                            {template.isFavorited ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
                        </IconButton>
                    </Stack>

                    <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{
                            mb: 2,
                            height: 40,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {template.description || t('templateMarket.noDescription')}
                    </Typography>

                    {/* 节点图标 */}
                    <Stack direction='row' spacing={0.5} mb={2}>
                        {icons.map((icon, idx) => (
                            <Avatar key={idx} src={icon} sx={{ width: 24, height: 24 }} variant='rounded' />
                        ))}
                        {icons.length === 0 && (
                            <Typography variant='caption' color='text.secondary'>
                                {t('templateMarket.noNodes')}
                            </Typography>
                        )}
                    </Stack>

                    {/* 标签 */}
                    <Stack direction='row' spacing={0.5} flexWrap='wrap' gap={0.5}>
                        {template.tags?.slice(0, 3).map((tag, idx) => (
                            <Chip key={idx} label={tag} size='small' variant='outlined' />
                        ))}
                    </Stack>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Stack direction='row' spacing={2}>
                        <Tooltip title={t('templateMarket.downloads')}>
                            <Stack direction='row' alignItems='center' spacing={0.5}>
                                <IconDownload size={14} />
                                <Typography variant='caption'>{template.useCount || 0}</Typography>
                            </Stack>
                        </Tooltip>
                        <Tooltip title={t('templateMarket.views')}>
                            <Stack direction='row' alignItems='center' spacing={0.5}>
                                <IconEye size={14} />
                                <Typography variant='caption'>{template.viewCount || 0}</Typography>
                            </Stack>
                        </Tooltip>
                        <Tooltip title={t('templateMarket.likes')}>
                            <Stack direction='row' alignItems='center' spacing={0.5}>
                                <IconHeart size={14} />
                                <Typography variant='caption'>{template.likeCount || 0}</Typography>
                            </Stack>
                        </Tooltip>
                    </Stack>
                    <Button size='small' variant='contained' onClick={(e) => handleUseTemplate(template, e)}>
                        {t('templateMarket.use')}
                    </Button>
                </CardActions>
            </Card>
        )
    }

    // 分享对话框组件
    const ShareTemplateDialog = () => {
        const [formData, setFormData] = useState({
            chatflowId: '',
            name: '',
            description: '',
            category: 'other',
            tags: '',
            isPublic: true
        })
        const [submitting, setSubmitting] = useState(false)

        const handleSubmit = async () => {
            if (!formData.name) {
                enqueueSnackbar({
                    message: t('templateMarket.nameRequired') || '请输入模板名称',
                    options: { variant: 'warning' }
                })
                return
            }
            setSubmitting(true)
            try {
                const response = await templateMarketApi.shareAsTemplate({
                    ...formData,
                    tags: formData.tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                })
                if (response.data) {
                    enqueueSnackbar({
                        message: t('templateMarket.shareSuccess') || '分享成功',
                        options: { variant: 'success' }
                    })
                    setShareDialog({ open: false })
                    loadTemplates()
                }
            } catch (error) {
                console.error('Share template failed:', error)
                enqueueSnackbar({
                    message: t('templateMarket.shareError') || '分享失败',
                    options: { variant: 'error' }
                })
            } finally {
                setSubmitting(false)
            }
        }

        return (
            <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false })} maxWidth='sm' fullWidth>
                <DialogTitle>{t('templateMarket.shareTemplate')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>{t('templateMarket.selectChatflow')}</InputLabel>
                            <Select
                                value={formData.chatflowId}
                                label={t('templateMarket.selectChatflow')}
                                onChange={(e) => setFormData({ ...formData, chatflowId: e.target.value })}
                            >
                                {chatflows.map((cf) => (
                                    <MenuItem key={cf.id} value={cf.id}>
                                        {cf.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('templateMarket.templateName')}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            fullWidth
                        />
                        <TextField
                            label={t('templateMarket.description')}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('templateMarket.category')}</InputLabel>
                            <Select
                                value={formData.category}
                                label={t('templateMarket.category')}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {categoryIcons[cat.id]} {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('templateMarket.tags')}
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder={t('templateMarket.tagsPlaceholder')}
                            helperText={t('templateMarket.tagsHelper')}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialog({ open: false })}>{t('common.cancel')}</Button>
                    <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
                        {t('templateMarket.share')}
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }

    // 详情对话框组件
    const TemplateDetailDialog = () => {
        const template = detailDialog.template
        if (!template) return null

        const icons = getNodeIcons(template.flowData)

        return (
            <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, template: null })} maxWidth='md' fullWidth>
                <DialogTitle>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                        <Typography variant='h4'>
                            {categoryIcons[template.category]} {template.name}
                        </Typography>
                        <IconButton onClick={() => setDetailDialog({ open: false, template: null })}>
                            <IconX />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                                {t('templateMarket.description')}
                            </Typography>
                            <Typography variant='body1' paragraph>
                                {template.description || t('templateMarket.noDescription')}
                            </Typography>

                            <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                                {t('templateMarket.includedNodes')}
                            </Typography>
                            <Stack direction='row' spacing={1} flexWrap='wrap' gap={1} mb={2}>
                                {icons.map((icon, idx) => (
                                    <Avatar key={idx} src={icon} sx={{ width: 32, height: 32 }} variant='rounded' />
                                ))}
                            </Stack>

                            {template.tags?.length > 0 && (
                                <>
                                    <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                                        {t('templateMarket.tags')}
                                    </Typography>
                                    <Stack direction='row' spacing={1} flexWrap='wrap' gap={1}>
                                        {template.tags.map((tag, idx) => (
                                            <Chip key={idx} label={tag} size='small' />
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card variant='outlined'>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant='caption' color='text.secondary'>
                                                {t('templateMarket.author')}
                                            </Typography>
                                            <Typography variant='body2'>{template.author || '-'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant='caption' color='text.secondary'>
                                                {t('templateMarket.category')}
                                            </Typography>
                                            <Typography variant='body2'>
                                                {categories.find((c) => c.id === template.category)?.name || template.category}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant='caption' color='text.secondary'>
                                                {t('templateMarket.version')}
                                            </Typography>
                                            <Typography variant='body2'>{template.version || '1.0.0'}</Typography>
                                        </Box>
                                        <Stack direction='row' spacing={3}>
                                            <Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {t('templateMarket.downloads')}
                                                </Typography>
                                                <Typography variant='body2'>{template.useCount || 0}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {t('templateMarket.likes')}
                                                </Typography>
                                                <Typography variant='body2'>{template.likeCount || 0}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {t('templateMarket.views')}
                                                </Typography>
                                                <Typography variant='body2'>{template.viewCount || 0}</Typography>
                                            </Box>
                                        </Stack>
                                        {template.avgRating && (
                                            <Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {t('templateMarket.rating')}
                                                </Typography>
                                                <Stack direction='row' alignItems='center' spacing={1}>
                                                    <Rating value={parseFloat(template.avgRating)} readOnly size='small' />
                                                    <Typography variant='body2'>({template.ratingCount || 0})</Typography>
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialog({ open: false, template: null })}>{t('common.close')}</Button>
                    <Button
                        variant='contained'
                        startIcon={<IconDownload size={18} />}
                        onClick={() => {
                            handleUseTemplate(template)
                            setDetailDialog({ open: false, template: null })
                        }}
                    >
                        {t('templateMarket.useTemplate')}
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }

    return (
        <MainCard>
            <Stack spacing={3}>
                {/* 头部 */}
                <Stack direction='row' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
                    <Typography variant='h3'>{t('templateMarket.title')}</Typography>
                    {user && (
                        <Button variant='contained' startIcon={<IconPlus />} onClick={handleOpenShareDialog}>
                            {t('templateMarket.shareTemplate')}
                        </Button>
                    )}
                </Stack>

                {/* 分类统计 */}
                <Stack direction='row' spacing={1} flexWrap='wrap' gap={1}>
                    <Chip
                        label={`${t('templateMarket.all')} (${categoryStats.reduce((sum, c) => sum + c.count, 0)})`}
                        onClick={() => setCategoryFilter('')}
                        color={categoryFilter === '' ? 'primary' : 'default'}
                        variant={categoryFilter === '' ? 'filled' : 'outlined'}
                    />
                    {categoryStats.map((stat) => (
                        <Chip
                            key={stat.category}
                            label={`${categoryIcons[stat.category] || ''} ${stat.categoryName} (${stat.count})`}
                            onClick={() => setCategoryFilter(stat.category)}
                            color={categoryFilter === stat.category ? 'primary' : 'default'}
                            variant={categoryFilter === stat.category ? 'filled' : 'outlined'}
                        />
                    ))}
                </Stack>

                {/* 筛选栏 */}
                <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' gap={2}>
                    <TextField
                        size='small'
                        placeholder={t('templateMarket.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <IconSearch size={18} />
                                </InputAdornment>
                            )
                        }}
                        sx={{ minWidth: 250 }}
                    />
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                        <InputLabel>{t('templateMarket.sortBy')}</InputLabel>
                        <Select value={sortBy} label={t('templateMarket.sortBy')} onChange={(e) => setSortBy(e.target.value)}>
                            <MenuItem value='useCount'>{t('templateMarket.sortByDownloads')}</MenuItem>
                            <MenuItem value='likeCount'>{t('templateMarket.sortByLikes')}</MenuItem>
                            <MenuItem value='viewCount'>{t('templateMarket.sortByViews')}</MenuItem>
                            <MenuItem value='createdDate'>{t('templateMarket.sortByDate')}</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                {/* 标签页 */}
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label={t('templateMarket.publicTemplates')} />
                    {user && <Tab label={t('templateMarket.myTemplates')} />}
                    {user && <Tab label={t('templateMarket.myFavorites')} />}
                </Tabs>

                {/* 模板列表 */}
                <TabPanel value={activeTab} index={0}>
                    {loading ? (
                        <Grid container spacing={gridSpacing}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Grid item xs={12} sm={6} md={4} key={i}>
                                    <Skeleton variant='rounded' height={280} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : templates.length === 0 ? (
                        <Alert severity='info'>{t('templateMarket.noTemplates')}</Alert>
                    ) : (
                        <>
                            <Grid container spacing={gridSpacing}>
                                {templates.map((template) => (
                                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                                        <TemplateCard template={template} />
                                    </Grid>
                                ))}
                            </Grid>
                            {totalPages > 1 && (
                                <Stack alignItems='center' mt={3}>
                                    <Pagination count={totalPages} page={page} onChange={(e, p) => setPage(p)} color='primary' />
                                </Stack>
                            )}
                        </>
                    )}
                </TabPanel>

                {user && (
                    <>
                        <TabPanel value={activeTab} index={1}>
                            {loading ? (
                                <Grid container spacing={gridSpacing}>
                                    {[1, 2, 3].map((i) => (
                                        <Grid item xs={12} sm={6} md={4} key={i}>
                                            <Skeleton variant='rounded' height={280} />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : templates.length === 0 ? (
                                <Alert severity='info'>{t('templateMarket.noMyTemplates')}</Alert>
                            ) : (
                                <Grid container spacing={gridSpacing}>
                                    {templates.map((template) => (
                                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                                            <TemplateCard template={template} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </TabPanel>

                        <TabPanel value={activeTab} index={2}>
                            {loading ? (
                                <Grid container spacing={gridSpacing}>
                                    {[1, 2, 3].map((i) => (
                                        <Grid item xs={12} sm={6} md={4} key={i}>
                                            <Skeleton variant='rounded' height={280} />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : templates.length === 0 ? (
                                <Alert severity='info'>{t('templateMarket.noFavorites')}</Alert>
                            ) : (
                                <Grid container spacing={gridSpacing}>
                                    {templates.map((template) => (
                                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                                            <TemplateCard template={template} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </TabPanel>
                    </>
                )}
            </Stack>

            {/* 对话框 */}
            <ShareTemplateDialog />
            <TemplateDetailDialog />
        </MainCard>
    )
}

export default TemplateMarket
