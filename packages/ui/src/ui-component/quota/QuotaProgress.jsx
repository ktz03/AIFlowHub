import PropTypes from 'prop-types'
import { Box, LinearProgress, Typography, Tooltip, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconAlertTriangle } from '@tabler/icons-react'

/**
 * 配额进度条组件
 */
const QuotaProgress = ({ quotaUsed, quotaLimit, showLabel = true, size = 'medium', warningThreshold = 80 }) => {
    const theme = useTheme()

    const percentage = quotaLimit > 0 ? Math.min((quotaUsed / quotaLimit) * 100, 100) : 0
    const remaining = Math.max(0, quotaLimit - quotaUsed)
    const isWarning = percentage >= warningThreshold
    const isExhausted = remaining <= 0

    const getColor = () => {
        if (isExhausted) return 'error'
        if (isWarning) return 'warning'
        return 'primary'
    }

    const getHeight = () => {
        switch (size) {
            case 'small':
                return 6
            case 'large':
                return 12
            default:
                return 8
        }
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toLocaleString()
    }

    return (
        <Box sx={{ width: '100%' }}>
            {showLabel && (
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 0.5 }}>
                    <Stack direction='row' alignItems='center' spacing={0.5}>
                        <Typography variant='body2' color='text.secondary'>
                            {formatNumber(quotaUsed)} / {formatNumber(quotaLimit)}
                        </Typography>
                        {isWarning && (
                            <Tooltip title={isExhausted ? '配额已用尽' : '配额即将用尽'}>
                                <IconAlertTriangle size={16} color={isExhausted ? theme.palette.error.main : theme.palette.warning.main} />
                            </Tooltip>
                        )}
                    </Stack>
                    <Typography variant='body2' color={getColor() + '.main'} fontWeight='medium'>
                        {percentage.toFixed(1)}%
                    </Typography>
                </Stack>
            )}
            <Tooltip
                title={`已使用: ${quotaUsed.toLocaleString()} / 总配额: ${quotaLimit.toLocaleString()} (剩余: ${remaining.toLocaleString()})`}
            >
                <LinearProgress
                    variant='determinate'
                    value={percentage}
                    color={getColor()}
                    sx={{
                        height: getHeight(),
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 1
                        }
                    }}
                />
            </Tooltip>
        </Box>
    )
}

QuotaProgress.propTypes = {
    quotaUsed: PropTypes.number.isRequired,
    quotaLimit: PropTypes.number.isRequired,
    showLabel: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    warningThreshold: PropTypes.number
}

export default QuotaProgress
