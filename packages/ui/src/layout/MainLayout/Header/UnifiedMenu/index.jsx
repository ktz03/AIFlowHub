import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Avatar,
    Box,
    Button,
    ButtonBase,
    ClickAwayListener,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Popper,
    Typography,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'
import AboutDialog from '@/ui-component/dialog/AboutDialog'
import { exportData, stringify } from '@/utils/exportImport'
import useNotifier from '@/utils/useNotifier'
import { getErrorMessage } from '@/utils/errorHandler'

// assets
import {
    IconLogout,
    IconSettings,
    IconUserCircle,
    IconLogin,
    IconUserPlus,
    IconFileExport,
    IconFileUpload,
    IconInfoCircle,
    IconX
} from '@tabler/icons-react'

// store
import { CLEAR_USER, closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction, REMOVE_DIRTY } from '@/store/actions'

// API
import authApi from '@/api/auth'
import exportImportApi from '@/api/exportimport'
import useApi from '@/hooks/useApi'

// Assets
import ExportingGIF from '@/assets/images/Exporting.gif'

const dataToExport = ['Chatflows', 'Agentflows', 'Tools', 'Variables', 'Assistants']

const ExportDialog = ({ show, onCancel, onExport }) => {
    const portalElement = document.getElementById('portal')
    const [selectedData, setSelectedData] = useState(['Chatflows', 'Agentflows', 'Tools', 'Variables', 'Assistants'])
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        if (show) setIsExporting(false)
        return () => setIsExporting(false)
    }, [show])

    const component = show ? (
        <Dialog onClose={!isExporting ? onCancel : undefined} open={show} fullWidth maxWidth='sm'>
            <DialogTitle sx={{ fontSize: '1rem' }}>{!isExporting ? 'Select Data to Export' : 'Exporting..'}</DialogTitle>
            <DialogContent>
                {!isExporting && (
                    <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                        {dataToExport.map((data, index) => (
                            <FormControlLabel
                                key={index}
                                control={
                                    <Checkbox
                                        color='success'
                                        checked={selectedData.includes(data)}
                                        onChange={(e) => {
                                            setSelectedData(
                                                e.target.checked ? [...selectedData, data] : selectedData.filter((item) => item !== data)
                                            )
                                        }}
                                    />
                                }
                                label={data}
                            />
                        ))}
                    </Stack>
                )}
                {isExporting && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img style={{ height: 'auto', width: 'auto' }} src={ExportingGIF} alt='Exporting' />
                            <span>Exporting data might take a while</span>
                        </div>
                    </Box>
                )}
            </DialogContent>
            {!isExporting && (
                <DialogActions>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button
                        disabled={selectedData.length === 0}
                        variant='contained'
                        onClick={() => {
                            setIsExporting(true)
                            onExport(selectedData)
                        }}
                    >
                        Export
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

ExportDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onExport: PropTypes.func
}

// ==============================|| UNIFIED MENU ||============================== //

const UnifiedMenu = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { t } = useTranslation()

    const { user, isAuthenticated } = useSelector((state) => state.auth)
    const customization = useSelector((state) => state.customization)

    const [open, setOpen] = useState(false)
    const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
    const [exportDialogOpen, setExportDialogOpen] = useState(false)

    const anchorRef = useRef(null)
    const inputRef = useRef()
    const prevOpen = useRef(open)

    // API hooks
    const importAllApi = useApi(exportImportApi.importData)
    const exportAllApi = useApi(exportImportApi.exportData)

    // Snackbar
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const handleToggle = () => setOpen((prev) => !prev)

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) return
        setOpen(false)
    }

    const handleLogout = async () => {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            dispatch({ type: CLEAR_USER })
            setOpen(false)
            navigate('/')
        }
    }

    const handleLogin = () => {
        setOpen(false)
        navigate('/auth/login')
    }

    const handleRegister = () => {
        setOpen(false)
        navigate('/auth/register')
    }

    const errorFailed = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const fileChange = (e) => {
        if (!e.target.files) return
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (evt) => {
            if (!evt?.target?.result) return
            const body = JSON.parse(evt.target.result)
            importAllApi.request(body)
        }
        reader.readAsText(file)
    }

    const onExport = (data) => {
        const body = {}
        if (data.includes('Chatflows')) body.chatflow = true
        if (data.includes('Agentflows')) body.agentflow = true
        if (data.includes('Tools')) body.tool = true
        if (data.includes('Variables')) body.variable = true
        if (data.includes('Assistants')) body.assistant = true
        exportAllApi.request(body)
    }

    useEffect(() => {
        if (importAllApi.data) {
            dispatch({ type: REMOVE_DIRTY })
            enqueueSnackbar({
                message: 'Import successful',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success',
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            navigate(0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importAllApi.data])

    useEffect(() => {
        if (importAllApi.error) {
            let errMsg = 'Invalid Imported File'
            if (importAllApi.error?.response?.data) {
                errMsg =
                    typeof importAllApi.error.response.data === 'object'
                        ? importAllApi.error.response.data.message
                        : importAllApi.error.response.data
            }
            errorFailed(`Failed to import: ${errMsg}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importAllApi.error])

    useEffect(() => {
        if (exportAllApi.data) {
            setExportDialogOpen(false)
            try {
                const dataStr = stringify(exportData(exportAllApi.data))
                const blob = new Blob([dataStr], { type: 'application/json' })
                const dataUri = URL.createObjectURL(blob)
                const linkElement = document.createElement('a')
                linkElement.setAttribute('href', dataUri)
                linkElement.setAttribute('download', exportAllApi.data.FileDefaultName)
                linkElement.click()
            } catch (error) {
                errorFailed(`Failed to export: ${getErrorMessage(error)}`)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exportAllApi.data])

    useEffect(() => {
        if (exportAllApi.error) {
            setExportDialogOpen(false)
            let errMsg = 'Internal Server Error'
            if (exportAllApi.error?.response?.data) {
                errMsg =
                    typeof exportAllApi.error.response.data === 'object'
                        ? exportAllApi.error.response.data.message
                        : exportAllApi.error.response.data
            }
            errorFailed(`Failed to export: ${errMsg}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exportAllApi.error])

    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
        }
        prevOpen.current = open
    }, [open])

    const getAvatarContent = () => {
        if (isAuthenticated && user?.username) {
            return user.username.charAt(0).toUpperCase()
        }
        return <IconUserCircle stroke={1.5} size='1.3rem' />
    }

    const getRoleLabel = (role) => {
        const roles = {
            admin: { label: t('auth.roleAdmin') || 'Admin', color: 'error' },
            user: { label: t('auth.roleUser') || 'User', color: 'primary' }
        }
        return roles[role] || { label: role, color: 'default' }
    }

    return (
        <>
            <ButtonBase ref={anchorRef} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Avatar
                    variant='rounded'
                    sx={{
                        ...theme.typography.commonAvatar,
                        ...theme.typography.mediumAvatar,
                        transition: 'all .2s ease-in-out',
                        background: isAuthenticated ? theme.palette.primary.light : theme.palette.secondary.light,
                        color: isAuthenticated ? theme.palette.primary.dark : theme.palette.secondary.dark,
                        '&:hover': {
                            background: isAuthenticated ? theme.palette.primary.dark : theme.palette.secondary.dark,
                            color: isAuthenticated ? theme.palette.primary.light : theme.palette.secondary.light
                        }
                    }}
                    onClick={handleToggle}
                    color='inherit'
                >
                    {getAvatarContent()}
                </Avatar>
            </ButtonBase>

            <Popper
                placement='bottom-end'
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                popperOptions={{
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 14]
                            }
                        }
                    ]
                }}
            >
                {({ TransitionProps }) => (
                    <Transitions in={open} {...TransitionProps}>
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                                    {isAuthenticated ? (
                                        // 已登录状态
                                        <Box sx={{ p: 2 }}>
                                            {/* 用户信息 */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        bgcolor: theme.palette.primary.main,
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {user?.username?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant='h4'>{user?.username}</Typography>
                                                    <Typography variant='caption' color='text.secondary'>
                                                        {user?.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {user?.role && (
                                                <Chip
                                                    size='small'
                                                    label={getRoleLabel(user.role).label}
                                                    color={getRoleLabel(user.role).color}
                                                    sx={{ mb: 1 }}
                                                />
                                            )}
                                            <Divider />
                                            <List
                                                component='nav'
                                                sx={{
                                                    width: '100%',
                                                    maxWidth: 250,
                                                    minWidth: 200,
                                                    backgroundColor: theme.palette.background.paper,
                                                    borderRadius: '10px',
                                                    [theme.breakpoints.down('md')]: {
                                                        minWidth: '100%'
                                                    },
                                                    '& .MuiListItemButton-root': {
                                                        mt: 0.5
                                                    }
                                                }}
                                            >
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => {
                                                        setOpen(false)
                                                        // TODO: 跳转到账户设置
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <IconSettings stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant='body2'>
                                                                {t('auth.accountSettings') || 'Account Settings'}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItemButton>
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => setExportDialogOpen(true)}
                                                >
                                                    <ListItemIcon>
                                                        <IconFileExport stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('settings.export')}</Typography>}
                                                    />
                                                </ListItemButton>
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => inputRef.current.click()}
                                                >
                                                    <ListItemIcon>
                                                        <IconFileUpload stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('settings.import')}</Typography>}
                                                    />
                                                </ListItemButton>
                                                <input ref={inputRef} type='file' hidden onChange={fileChange} accept='.json' />
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => {
                                                        setOpen(false)
                                                        setAboutDialogOpen(true)
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <IconInfoCircle stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('header.aboutFlowise')}</Typography>}
                                                    />
                                                </ListItemButton>
                                                <Divider sx={{ my: 1 }} />
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={handleLogout}
                                                >
                                                    <ListItemIcon>
                                                        <IconLogout stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('auth.logout') || 'Logout'}</Typography>}
                                                    />
                                                </ListItemButton>
                                            </List>
                                        </Box>
                                    ) : (
                                        // 未登录状态
                                        <Box sx={{ p: 2 }}>
                                            {/* 欢迎信息 */}
                                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        bgcolor: theme.palette.grey[200],
                                                        color: theme.palette.grey[600],
                                                        margin: '0 auto',
                                                        mb: 1
                                                    }}
                                                >
                                                    <IconUserCircle size={28} />
                                                </Avatar>
                                                <Typography variant='h4' gutterBottom>
                                                    {t('auth.welcome') || 'Welcome'}
                                                </Typography>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {t('auth.loginPrompt') || 'Sign in to unlock more features'}
                                                </Typography>
                                            </Box>
                                            {/* 登录/注册按钮 */}
                                            <Stack spacing={1} sx={{ mb: 2 }}>
                                                <Button
                                                    fullWidth
                                                    variant='contained'
                                                    startIcon={<IconLogin size={18} />}
                                                    onClick={handleLogin}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    {t('auth.login') || 'Login'}
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    variant='outlined'
                                                    startIcon={<IconUserPlus size={18} />}
                                                    onClick={handleRegister}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    {t('auth.register') || 'Register'}
                                                </Button>
                                            </Stack>
                                            <Divider />
                                            {/* 设置菜单 */}
                                            <List
                                                component='nav'
                                                sx={{
                                                    width: '100%',
                                                    maxWidth: 250,
                                                    minWidth: 200,
                                                    backgroundColor: theme.palette.background.paper,
                                                    borderRadius: '10px',
                                                    [theme.breakpoints.down('md')]: {
                                                        minWidth: '100%'
                                                    },
                                                    '& .MuiListItemButton-root': {
                                                        mt: 0.5
                                                    }
                                                }}
                                            >
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => setExportDialogOpen(true)}
                                                >
                                                    <ListItemIcon>
                                                        <IconFileExport stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('settings.export')}</Typography>}
                                                    />
                                                </ListItemButton>
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => inputRef.current.click()}
                                                >
                                                    <ListItemIcon>
                                                        <IconFileUpload stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('settings.import')}</Typography>}
                                                    />
                                                </ListItemButton>
                                                <input ref={inputRef} type='file' hidden onChange={fileChange} accept='.json' />
                                                <ListItemButton
                                                    sx={{ borderRadius: `${customization.borderRadius}px` }}
                                                    onClick={() => {
                                                        setOpen(false)
                                                        setAboutDialogOpen(true)
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <IconInfoCircle stroke={1.5} size='1.3rem' />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={<Typography variant='body2'>{t('header.aboutFlowise')}</Typography>}
                                                    />
                                                </ListItemButton>
                                            </List>
                                        </Box>
                                    )}
                                </MainCard>
                            </ClickAwayListener>
                        </Paper>
                    </Transitions>
                )}
            </Popper>

            <AboutDialog show={aboutDialogOpen} onCancel={() => setAboutDialogOpen(false)} />
            <ExportDialog show={exportDialogOpen} onCancel={() => setExportDialogOpen(false)} onExport={onExport} />
        </>
    )
}

export default UnifiedMenu
