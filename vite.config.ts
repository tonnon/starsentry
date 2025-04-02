import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars based on mode (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      proxy: {
        // Proxy NASA API requests through your dev server to avoid CORS issues
        '/nasa-api': {
          target: 'https://api.nasa.gov',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nasa-api/, ''),
          // Add API key to all proxied requests
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.VITE_NASA_API_KEY) {
                const url = new URL(proxyReq.path, 'https://api.nasa.gov');
                url.searchParams.append('api_key', env.VITE_NASA_API_KEY);
                proxyReq.path = url.pathname + url.search;
              }
            });
          }
        },
        // Your existing local API proxy
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Safely expose only the NASA API key to the client
      'import.meta.env.VITE_NASA_API_KEY': JSON.stringify(env.VITE_NASA_API_KEY),
      // For libraries that might expect process.env
      'process.env.VITE_NASA_API_KEY': JSON.stringify(env.VITE_NASA_API_KEY),
      // Global environment indicator
      'import.meta.env.MODE': JSON.stringify(mode)
    },
    build: {
      // Ensure environment variables are replaced correctly in production
      rollupOptions: {
        output: {
          manualChunks: undefined, // Disable automatic chunk splitting for simpler debugging
        }
      }
    }
  };
});