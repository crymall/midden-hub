import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, "../../shared/ui/assets"),
  resolve: {
    alias: {
      "@shared/core": path.resolve(__dirname, "../../shared/core"),
      "@shared/ui": path.resolve(__dirname, "../../shared/ui"),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
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
      "^/netbook(/|$)": {
        target: "http://localhost:5099",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/netbook/, ""),
      },
    },
  },
});
