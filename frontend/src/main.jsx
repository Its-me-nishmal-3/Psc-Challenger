import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
const updateSW = registerSW({
    onNeedRefresh() {
        // Optional: Prompt user to refresh
        console.log('New content available, verify to reload.');
    },
    onOfflineReady() {
        console.log('App is ready for offline work.');
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
