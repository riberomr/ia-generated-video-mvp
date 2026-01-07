import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    envDir: '../../', // Load .env from monorepo root
    plugins: [react()],
    server: {
        port: 5173,
        host: true
    }
})
