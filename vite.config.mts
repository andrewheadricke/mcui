import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json' with { type: "json" };

export default defineConfig({
  base: './',
  server: {
    host: "0.0.0.0"
  },
  plugins: [
    tailwindcss(),
  ],
  define: {
    appVersion: JSON.stringify(packageJson.version)
  },
  build: {
    assetsInlineLimit: 0,
    minify: true,
    rollupOptions: {
      output: {
        inlineDynamicImports : false,
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
      external: ['net','stream','@serialport', 'child_process', 'events', 'util', 'fs', 'path', 'os'],
    },
  },
})