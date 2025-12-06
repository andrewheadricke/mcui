import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json' with { type: "json" };
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    host: "0.0.0.0"
  },
  plugins: [
    tailwindcss(),
    VitePWA({
      selfDestroying: true, 
      manifest: {
        short_name: "MCui",
        name: "MCui",
        "description": "A Meshcore compatible UI",
        icons: [
          {
            src: "./mcui_192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "./mcui_512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: "index.html",
        display: "standalone"
      }
    })
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