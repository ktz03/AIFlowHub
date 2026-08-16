import { useSelector } from 'react-redux'

// Assets
import logoLight from '@/assets/images/aiflow_logo.png'
import logoDark from '@/assets/images/aiflow_logo_dark.png'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <img src={customization.isDarkMode ? logoDark : logoLight} alt='AIFlowHub' style={{ height: 40 }} />
        </div>
    )
}

export default Logo
