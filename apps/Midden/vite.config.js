import faroUploader from "@grafana/faro-rollup-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    faroUploader({
      appName: "midden",
      endpoint: "https://faro-api-prod-us-east-2.grafana.net/faro/api/v1",
      appId: "1381",
      stackId: "1595848",
      verbose: true,
      apiKey: process.env.FARO_API_KEY,
      gzipContents: true,
    }),
  ],
  publicDir: path.resolve(__dirname, "../../shared/ui/assets"),
  resolve: {
    alias: {
      "@shared/core": path.resolve(__dirname, "../../shared/core"),
      "@shared/ui": path.resolve(__dirname, "../../shared/ui"),
    },
  },
  server: {
    proxy: {
      "^/iam(/|$)": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/iam/, ""),
      },
      "^/canteen(/|$)": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/canteen/, ""),
      },
    },
  },
});
