import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from 'vite-plugin-sitemap'
import { fbxLoaderPatchPlugin } from './vite-plugin-fbx-loader-patch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const APP_URL = 'https://animator.roboticela.com'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Pin env files to this directory so variables load during `vite build` even if cwd differs (e.g. tooling wrappers).
  const envDir = __dirname
  const env = loadEnv(mode, envDir, '')
  const appUrl = env.VITE_APP_URL ?? env.APP_URL ?? APP_URL
  const apiUrl = env.VITE_API_URL ?? env.API_URL ?? ''

  return {
    envDir,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      'import.meta.env.VITE_APP_URL': JSON.stringify(appUrl),
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    plugins: [
      fbxLoaderPatchPlugin(),
      react(),
      tailwindcss(),
      sitemap({
        hostname: APP_URL,
        dynamicRoutes: ['/'],
        changefreq: 'weekly',
        priority: 1.0,
        lastmod: new Date(),
        readable: true,
      }),
    ],

    // Tauri (Android / iOS dev) must reach the Vite process from the device/emulator (e.g. 10.8.0.2:5173).
    // The default (localhost only) will hang with "Waiting for your frontend dev server" on mobile.
    clearScreen: false,
    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',
    },
  }
})
