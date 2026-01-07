import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Divider, List, Typography } from '@mui/material'

// project imports
import NavItem from '../NavItem'
import NavCollapse from '../NavCollapse'

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //

const NavGroup = ({ item }) => {
    const theme = useTheme()
    const { t } = useTranslation()

    // 获取当前用户角色
    const getUserRole = () => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                return user.role
            }
        } catch (e) {
            // ignore
        }
        return null
    }

    const userRole = getUserRole()

    // menu list collapse & items
    const items = item.children
        ?.filter((menu) => {
            // 如果菜单项标记为 adminOnly，只有管理员可见
            if (menu.adminOnly && userRole !== 'admin') {
                return false
            }
            return true
        })
        .map((menu) => {
            switch (menu.type) {
                case 'collapse':
                    return <NavCollapse key={menu.id} menu={menu} level={1} />
                case 'item':
                    return <NavItem key={menu.id} item={menu} level={1} navType='MENU' />
                default:
                    return (
                        <Typography key={menu.id} variant='h6' color='error' align='center'>
                            Menu Items Error
                        </Typography>
                    )
            }
        })

    return (
        <>
            <List
                subheader={
                    item.title && (
                        <Typography variant='caption' sx={{ ...theme.typography.menuCaption }} display='block' gutterBottom>
                            {t(item.title, item.title)}
                            {item.caption && (
                                <Typography variant='caption' sx={{ ...theme.typography.subMenuCaption }} display='block' gutterBottom>
                                    {t(item.caption, item.caption)}
                                </Typography>
                            )}
                        </Typography>
                    )
                }
                sx={{ py: '20px' }}
            >
                {items}
            </List>

            {/* group divider */}
            <Divider sx={{ mt: 0.25, mb: 1.25 }} />
        </>
    )
}

NavGroup.propTypes = {
    item: PropTypes.object
}

export default NavGroup
