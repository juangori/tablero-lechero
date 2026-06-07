import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sirve el sitio bajo /tablero-lechero/
export default defineConfig({
  base: '/tablero-lechero/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Tablero Lechero — Campo Norte',
        short_name: 'Tablero',
        description: 'KPIs lecheros: presupuesto vs real vs año anterior',
        theme_color: '#15803d',
        background_color: '#f6f7f4',
        display: 'standalone',
        start_url: '/tablero-lechero/',
        scope: '/tablero-lechero/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/tablero-lechero/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
