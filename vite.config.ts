
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
          if (id.includes('/src/components/ui/')) {
            return 'ui';
          }
          // Don't chunk LocationContentGrid separately
          if (id.includes('/src/components/location/LocationContentGrid')) {
            return 'location-components';
          }
          // Group other location components
          if (id.includes('/src/components/location/')) {
            return 'location-components';
          }
        }
      }
    },
    assetsDir: 'assets',
    copyPublicDir: true, // Ensures public directory is copied to dist
    chunkSizeWarningLimit: 1200, // Increase the chunk size warning limit
  },
  optimizeDeps: {
    exclude: ['lovable-tagger'],
    include: ['suncalc', 'date-fns'],
  }
}));
