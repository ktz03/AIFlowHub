// assets
import {
    IconUsersGroup,
    IconHierarchy,
    IconBuildingStore,
    IconKey,
    IconTool,
    IconLock,
    IconRobot,
    IconVariable,
    IconFiles,
    IconUserCog,
    IconChartBar,
    IconGauge,
    IconTemplate,
    IconScale,
    IconHistory,
    IconSettings
} from '@tabler/icons-react'

// constant
const icons = {
    IconUsersGroup,
    IconHierarchy,
    IconBuildingStore,
    IconKey,
    IconTool,
    IconLock,
    IconRobot,
    IconVariable,
    IconFiles,
    IconUserCog,
    IconChartBar,
    IconGauge,
    IconTemplate,
    IconScale,
    IconHistory,
    IconSettings
}

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
    id: 'dashboard',
    title: '',
    type: 'group',
    children: [
        {
            id: 'chatflows',
            title: 'menu.chatflows',
            type: 'item',
            url: '/chatflows',
            icon: icons.IconHierarchy,
            breadcrumbs: true
        },
        {
            id: 'agentflows',
            title: 'menu.agentflows',
            type: 'item',
            url: '/agentflows',
            icon: icons.IconUsersGroup,
            breadcrumbs: true
        },
        {
            id: 'assistants',
            title: 'menu.assistants',
            type: 'item',
            url: '/assistants',
            icon: icons.IconRobot,
            breadcrumbs: true
        },
        {
            id: 'marketplaces',
            title: 'menu.marketplaces',
            type: 'item',
            url: '/marketplaces',
            icon: icons.IconBuildingStore,
            breadcrumbs: true
        },
        {
            id: 'template-market',
            title: 'menu.templateMarket',
            type: 'item',
            url: '/template-market',
            icon: icons.IconTemplate,
            breadcrumbs: true
        },
        {
            id: 'model-evaluation',
            title: 'menu.modelEvaluation',
            type: 'item',
            url: '/model-evaluation',
            icon: icons.IconScale,
            breadcrumbs: true
        },
        {
            id: 'tools',
            title: 'menu.tools',
            type: 'item',
            url: '/tools',
            icon: icons.IconTool,
            breadcrumbs: true
        },
        {
            id: 'credentials',
            title: 'menu.credentials',
            type: 'item',
            url: '/credentials',
            icon: icons.IconLock,
            breadcrumbs: true
        },
        {
            id: 'variables',
            title: 'menu.variables',
            type: 'item',
            url: '/variables',
            icon: icons.IconVariable,
            breadcrumbs: true
        },
        {
            id: 'apikey',
            title: 'menu.apiKeys',
            type: 'item',
            url: '/apikey',
            icon: icons.IconKey,
            breadcrumbs: true
        },
        {
            id: 'document-stores',
            title: 'menu.documentStores',
            type: 'item',
            url: '/document-stores',
            icon: icons.IconFiles,
            breadcrumbs: true
        },
        {
            id: 'usage-stats',
            title: 'menu.usageStats',
            type: 'item',
            url: '/usage-stats',
            icon: icons.IconChartBar,
            breadcrumbs: true
        },
        {
            id: 'chat-history',
            title: 'menu.chatHistory',
            type: 'item',
            url: '/chat-history',
            icon: icons.IconHistory,
            breadcrumbs: true
        },
        {
            id: 'quota',
            title: 'menu.quota',
            type: 'item',
            url: '/quota',
            icon: icons.IconGauge,
            breadcrumbs: true
        },
        {
            id: 'admin-users',
            title: 'menu.userManagement',
            type: 'item',
            url: '/admin/users',
            icon: icons.IconUserCog,
            breadcrumbs: true,
            adminOnly: true
        },
        {
            id: 'system-config',
            title: 'menu.systemConfig',
            type: 'item',
            url: '/system-config',
            icon: icons.IconSettings,
            breadcrumbs: true,
            adminOnly: true
        }
    ]
}

export default dashboard
