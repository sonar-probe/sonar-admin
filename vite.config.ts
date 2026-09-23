import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// https://vite.dev/config/
export default defineConfig(() => {
  const buildTime = new Date().toISOString();

  const envPath = path.resolve(process.cwd(), ".env.development");
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
  if (!process.env.VITE_API_TARGET) {
    process.env.VITE_API_TARGET = "http://127.0.0.1:25774";
  }

  return {
    // The admin app is always served under /admin/ by the Go backend
    // (see server/internal/platform/frontend). Keep the same base locally
    // so asset URLs and client-side routes match production.
    base: "/admin/",
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        open: false,
        filename: "bundle-analysis.html",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(buildTime),
      __SONAR_APP_KIND__: JSON.stringify("admin"),
      __SONAR_BOOTSTRAP__: JSON.stringify(false),
      __KOMARI_APP_KIND__: JSON.stringify("admin"),
      __KOMARI_BOOTSTRAP__: JSON.stringify(false),
    },
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "./src") }],
    },
    build: {
      assetsDir: "assets",
      outDir: "dist",
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // go embed ignore files start with '_'
          chunkFileNames: "assets/chunk-[name]-[hash].js",
          entryFileNames: "assets/entry-[name]-[hash].js",
          // Do not use manualChunks, use React.lazy() and <Suspense> instead
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
          rewriteWsOrigin: true,
          ws: true,
        },
        "/themes": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});
