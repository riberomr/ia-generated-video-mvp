import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    envDir: '../../', // Load .env from monorepo root
    plugins: [react()],
    resolve: {
        alias: {
            '@eduvideogen/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts')
        }
    },
    server: {
        port: 5173,
        host: true
    }
})
