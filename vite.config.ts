/// <reference types="vitest/config" />
/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_TARGET__: JSON.stringify(process.env.BUILD_TARGET || 'web'),
    __IS_VSCODE__: JSON.stringify(process.env.BUILD_TARGET === 'vscode'),
  },
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo192.png", "logo512.png", "ogi.png"],
      manifest: {
        name: "きみがためtools - LABERU -",
        short_name: "LABERU",
        theme_color: "#9575CD",
        background_color: "#EEEEEE",
        lang: "ja",
        start_url: "/laberu/",
        scope: "/laberu/",
        display: "standalone",
        icons: [
          {
            src: "static/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "static/logo192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "maskable",
          },
          {
            src: "static/logo512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4.5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/laberu\/storybook/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              // /laberu/storybook/ 配下は除外
              if (url.pathname.startsWith("/laberu/storybook/")) {
                return false;
              }
              return /.*\.(js|css|html|png|jpg|jpeg|svg|wav)$/.test(url.pathname);
            },
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets-cache",
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  esbuild: {
    target: "esnext",
  },
  test: {
    globals: true,
    // Jestの global な関数 (`describe`, `test` など) を有効にする
    environment: "jsdom",
    // JSDOM環境を使う
    setupFiles: "./vitest.setup.ts", // テスト前のセットアップファイル
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 8080,
  },
  worker: {
    format: "es", // 必要に応じて設定
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
