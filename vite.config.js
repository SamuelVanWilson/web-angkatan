import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: '/',
    plugins: [
        tailwindcss(),
    ],
    server: {
        // Enable SPA fallback for clean URLs
        historyApiFallback: true,
    },
})
