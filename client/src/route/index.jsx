import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import Dashboard from '../pages/Dashboard'
import Logs from '../pages/Logs'
import Help from '../pages/Help'

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <Dashboard />
            },
            {
                path: '/logs',
                element: <Logs />
            },
            {
                path: '/help',
                element: <Help />
            }
        ]
    }
])

export default router