import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { useTranslation } from 'react-i18next'
import moment from 'moment'

// material-ui
import {
    Button,
    Box,
    Chip,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Avatar
} from '@mui/material'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import { useTheme, styled } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'

// API
import authApi from '@/api/auth'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// utils
import useNotifier from '@/utils/useNotifier'

// Icons
import { IconTrash, IconEdit, IconX, IconUserShield, IconUsers } from '@tabler/icons-react'
import UserEmptySVG from '@/assets/images/api_empty.svg'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,
    padding: '6px 16px',
    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 64
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

// 角色和状态配置
const ROLES = {
    admin: { label: '管理员', color: 'error' },
    user: { label: '普通用户', color: 'primary' }
}

const STATUSES = {
    active: { label: '正常', color: 'success' },
    inactive: { label: '禁用', color: 'error' },
    pending: { label: '待审核', color: 'warning' }
}

// 编辑用户对话框
const EditUserDialog = ({ open, user, onClose, onConfirm }) => {
    const { t } = useTranslation()
    const [role, setRole] = useState(user?.role || 'user')
    const [status, setStatus] = useState(user?.status || 'active')
    const [quotaLimit, setQuotaLimit] = useState(user?.quotaLimit || 100000)

    useEffect(() => {
        if (user) {
            setRole(user.role)
            setStatus(user.status)
            setQuotaLimit(user.quotaLimit)
        }
    }, [user])

    const handleConfirm = () => {
        onConfirm({ role, status, quotaLimit })
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>{t('admin.editUser')}</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>{user?.username?.charAt(0).toUpperCase()}</Avatar>
                        <Box>
                            <Typography variant='h6'>{user?.username}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {user?.email}
                            </Typography>
                        </Box>
                    </Box>
                    <FormControl fullWidth>
                        <InputLabel>{t('admin.role')}</InputLabel>
                        <Select value={role} label={t('admin.role')} onChange={(e) => setRole(e.target.value)}>
                            <MenuItem value='admin'>{t('admin.roleAdmin')}</MenuItem>
                            <MenuItem value='user'>{t('admin.roleUser')}</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('admin.status')}</InputLabel>
                        <Select value={status} label={t('admin.status')} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value='active'>{t('admin.statusActive')}</MenuItem>
                            <MenuItem value='inactive'>{t('admin.statusInactive')}</MenuItem>
                            <MenuItem value='pending'>{t('admin.statusPending')}</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label={t('admin.quotaLimit')}
                        type='number'
                        value={quotaLimit}
                        onChange={(e) => setQuotaLimit(parseInt(e.target.value) || 0)}
                        helperText={t('admin.quotaHelp')}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
                <Button variant='contained' onClick={handleConfirm}>
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

// 主组件
const UserManagement = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const { t } = useTranslation()
    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState('')
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)

    const { confirm } = useConfirm()
    const getAllUsersApi = useApi(authApi.getAllUsers)

    const onSearchChange = (event) => setSearch(event.target.value)

    const filterUsers = (user) => {
        const searchLower = search.toLowerCase()
        return user.username?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower)
    }

    const handleEdit = (user) => {
        setSelectedUser(user)
        setEditDialogOpen(true)
    }

    const handleEditConfirm = async ({ role, status, quotaLimit }) => {
        try {
            if (role !== selectedUser.role) {
                await authApi.updateUserRole(selectedUser.id, role)
            }
            if (status !== selectedUser.status) {
                await authApi.updateUserStatus(selectedUser.id, status)
            }
            if (quotaLimit !== selectedUser.quotaLimit) {
                await authApi.updateUserQuota(selectedUser.id, quotaLimit)
            }
            enqueueSnackbar({
                message: t('notification.updated'),
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
            setEditDialogOpen(false)
            getAllUsersApi.request()
        } catch (error) {
            enqueueSnackbar({
                message: `${t('notification.error')}: ${error.response?.data?.message || error.message}`,
                options: {
                    variant: 'error',
                    persist: true,
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

    const handleDelete = async (user) => {
        const isConfirmed = await confirm({
            title: t('common.delete'),
            description: `${t('dialog.confirmDeleteMessage')} [${user.username}]?`,
            confirmButtonName: t('common.delete'),
            cancelButtonName: t('common.cancel')
        })

        if (isConfirmed) {
            try {
                await authApi.deleteUser(user.id)
                enqueueSnackbar({
                    message: t('notification.deleted'),
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
                getAllUsersApi.request()
            } catch (error) {
                enqueueSnackbar({
                    message: `${t('notification.error')}: ${error.response?.data?.message || error.message}`,
                    options: {
                        variant: 'error',
                        persist: true,
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
    }

    useEffect(() => {
        getAllUsersApi.request()
    }, [])

    useEffect(() => {
        setLoading(getAllUsersApi.loading)
    }, [getAllUsersApi.loading])

    useEffect(() => {
        if (getAllUsersApi.data) {
            // 尝试多种可能的数据结构
            let userData = null
            if (getAllUsersApi.data.users) {
                userData = getAllUsersApi.data.users
            } else if (getAllUsersApi.data.data?.users) {
                userData = getAllUsersApi.data.data.users
            } else if (Array.isArray(getAllUsersApi.data)) {
                userData = getAllUsersApi.data
            }

            if (userData && Array.isArray(userData)) {
                setUsers(userData)
            }
        }
    }, [getAllUsersApi.data])

    useEffect(() => {
        if (getAllUsersApi.error) {
            setError(getAllUsersApi.error)
        }
    }, [getAllUsersApi.error])

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            onSearchChange={onSearchChange}
                            search={true}
                            searchPlaceholder={t('admin.searchPlaceholder')}
                            titleKey='admin.userManagement'
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconUsers size={20} />
                                <Typography variant='body2' color='text.secondary'>
                                    {t('admin.totalUsers')}: {users.length}
                                </Typography>
                            </Box>
                        </ViewHeader>
                        {!isLoading && users.length <= 0 ? (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img style={{ objectFit: 'cover', height: '20vh', width: 'auto' }} src={UserEmptySVG} alt='Empty' />
                                </Box>
                                <div>{t('admin.noUsers')}</div>
                            </Stack>
                        ) : (
                            <TableContainer
                                sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                                component={Paper}
                            >
                                <Table sx={{ minWidth: 650 }} aria-label='user table'>
                                    <TableHead
                                        sx={{
                                            backgroundColor: customization.isDarkMode
                                                ? theme.palette.common.black
                                                : theme.palette.grey[100],
                                            height: 56
                                        }}
                                    >
                                        <TableRow>
                                            <StyledTableCell>{t('admin.username')}</StyledTableCell>
                                            <StyledTableCell>{t('admin.email')}</StyledTableCell>
                                            <StyledTableCell>{t('admin.role')}</StyledTableCell>
                                            <StyledTableCell>{t('admin.status')}</StyledTableCell>
                                            <StyledTableCell>{t('admin.quota')}</StyledTableCell>
                                            <StyledTableCell>{t('admin.lastLogin')}</StyledTableCell>
                                            <StyledTableCell>{t('common.actions')}</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading
                                            ? [1, 2, 3].map((i) => (
                                                  <StyledTableRow key={i}>
                                                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                                          <StyledTableCell key={j}>
                                                              <Skeleton variant='text' />
                                                          </StyledTableCell>
                                                      ))}
                                                  </StyledTableRow>
                                              ))
                                            : users.filter(filterUsers).map((user) => (
                                                  <StyledTableRow key={user.id}>
                                                      <StyledTableCell>
                                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                              <Avatar
                                                                  sx={{
                                                                      width: 32,
                                                                      height: 32,
                                                                      bgcolor: user.role === 'admin' ? 'error.main' : 'primary.main'
                                                                  }}
                                                              >
                                                                  {user.username?.charAt(0).toUpperCase()}
                                                              </Avatar>
                                                              {user.username}
                                                              {user.role === 'admin' && (
                                                                  <IconUserShield size={16} color={theme.palette.error.main} />
                                                              )}
                                                          </Box>
                                                      </StyledTableCell>
                                                      <StyledTableCell>{user.email}</StyledTableCell>
                                                      <StyledTableCell>
                                                          <Chip
                                                              label={ROLES[user.role]?.label || user.role}
                                                              color={ROLES[user.role]?.color || 'default'}
                                                              size='small'
                                                          />
                                                      </StyledTableCell>
                                                      <StyledTableCell>
                                                          <Chip
                                                              label={STATUSES[user.status]?.label || user.status}
                                                              color={STATUSES[user.status]?.color || 'default'}
                                                              size='small'
                                                              variant='outlined'
                                                          />
                                                      </StyledTableCell>
                                                      <StyledTableCell>
                                                          <Typography variant='body2'>
                                                              {user.quotaUsed?.toLocaleString()} / {user.quotaLimit?.toLocaleString()}
                                                          </Typography>
                                                      </StyledTableCell>
                                                      <StyledTableCell>
                                                          {user.lastLoginAt ? moment(user.lastLoginAt).format('YYYY-MM-DD HH:mm') : '-'}
                                                      </StyledTableCell>
                                                      <StyledTableCell>
                                                          <IconButton
                                                              title={t('common.edit')}
                                                              color='primary'
                                                              onClick={() => handleEdit(user)}
                                                          >
                                                              <IconEdit />
                                                          </IconButton>
                                                          <IconButton
                                                              title={t('common.delete')}
                                                              color='error'
                                                              onClick={() => handleDelete(user)}
                                                          >
                                                              <IconTrash />
                                                          </IconButton>
                                                      </StyledTableCell>
                                                  </StyledTableRow>
                                              ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Stack>
                )}
            </MainCard>
            <EditUserDialog
                open={editDialogOpen}
                user={selectedUser}
                onClose={() => setEditDialogOpen(false)}
                onConfirm={handleEditConfirm}
            />
            <ConfirmDialog />
        </>
    )
}

export default UserManagement
