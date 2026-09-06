import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isNativeProduction = mode === 'android-production'
  const platform = isNativeProduction ? 'native' : (env.VITE_APP_PLATFORM || 'web')
  const isProductionMode = mode === 'production' || isNativeProduction
  const isDeployedMode = isProductionMode || mode === 'staging'
  const apiUrl = env.VITE_API_BASE_URL?.trim()

  if (platform !== 'web' && platform !== 'native') {
    throw new Error('VITE_APP_PLATFORM must be "web" or "native".')
  }
  if (isDeployedMode && !apiUrl) {
    throw new Error(`VITE_API_BASE_URL is required for ${mode} builds.`)
  }
  if (isDeployedMode && apiUrl) {
    const hostname = new URL(apiUrl).hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      throw new Error(`${mode} builds cannot use a localhost API URL.`)
    }
  }

  const adminEnabled = !(platform === 'native' && isProductionMode)

  return {
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __ADMIN_ENABLED__: JSON.stringify(adminEnabled),
    __APP_PLATFORM__: JSON.stringify(platform),
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
