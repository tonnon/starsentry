import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      // For local development proxy
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Explicitly pass the env var to client
    'import.meta.env.VITE_NASA_API_KEY': JSON.stringify(process.env.VITE_NASA_API_KEY),
    // For global access if needed
    'process.env.VITE_NASA_API_KEY': JSON.stringify(process.env.VITE_NASA_API_KEY)
  }
}));
