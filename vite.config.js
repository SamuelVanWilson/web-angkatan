import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    server: {
        // Enable SPA fallback for clean URLs
        historyApiFallback: true,
    },
})
