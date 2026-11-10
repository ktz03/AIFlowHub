import { createPortal } from 'react-dom'
import { useState } from 'react'
import PropTypes from 'prop-types'

import { Dialog, DialogActions, DialogContent, DialogTitle, ThemeProvider, createTheme, TextField, Box } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'

// 创建固定的浅色主题
const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2196f3'
        },
        background: {
            default: '#ffffff',
            paper: '#ffffff'
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)'
        }
    },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff',
                    '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.4)'
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#2196f3',
                        borderWidth: '2px'
                    }
                },
                input: {
                    color: 'rgba(0, 0, 0, 0.87)',
                    backgroundColor: '#ffffff'
                }
            }
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-focused': {
                        color: '#2196f3'
                    }
                }
            }
        }
    }
})

const LoginDialog = ({ show, dialogProps, onConfirm }) => {
    const portalElement = document.getElementById('portal')
    const [usernameVal, setUsernameVal] = useState('')
    const [passwordVal, setPasswordVal] = useState('')

    const component = show ? (
        <ThemeProvider theme={lightTheme}>
            <Dialog
                onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                        onConfirm(usernameVal, passwordVal)
                    }
                }}
                open={show}
                fullWidth
                maxWidth='xs'
                aria-labelledby='alert-dialog-title'
                aria-describedby='alert-dialog-description'
                PaperProps={{
                    sx: {
                        backgroundColor: '#ffffff',
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        fontSize: '1rem',
                        color: 'rgba(0, 0, 0, 0.87)',
                        backgroundColor: '#ffffff'
                    }}
                    id='alert-dialog-title'
                >
                    {dialogProps.title}
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: '#ffffff', pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            size='small'
                            label='Username'
                            placeholder='john doe'
                            value={usernameVal}
                            onChange={(e) => setUsernameVal(e.target.value)}
                            variant='outlined'
                        />
                        <TextField
                            fullWidth
                            size='small'
                            label='Password'
                            type='password'
                            value={passwordVal}
                            onChange={(e) => setPasswordVal(e.target.value)}
                            variant='outlined'
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ backgroundColor: '#ffffff', p: 2 }}>
                    <StyledButton variant='contained' onClick={() => onConfirm(usernameVal, passwordVal)}>
                        {dialogProps.confirmButtonName}
                    </StyledButton>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    ) : null

    return createPortal(component, portalElement)
}

LoginDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onConfirm: PropTypes.func
}

export default LoginDialog
