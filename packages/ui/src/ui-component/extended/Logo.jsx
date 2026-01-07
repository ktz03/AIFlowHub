import logo from '@/assets/images/flowise_logo.png'
import logoDark from '@/assets/images/flowise_logo_dark.png'

import { useSelector } from 'react-redux'
import { Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)
    const theme = useTheme()

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img
                    style={{ objectFit: 'contain', height: 32, width: 32 }}
                    src={customization.isDarkMode ? logoDark : logo}
                    alt='AIFlowHub'
                />
                <Typography
                    variant='h4'
                    sx={{
                        fontWeight: 700,
                        background: customization.isDarkMode
                            ? 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)'
                            : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.5px'
                    }}
                >
                    AIFlowHub
                </Typography>
            </Box>
        </div>
    )
}

export default Logo
