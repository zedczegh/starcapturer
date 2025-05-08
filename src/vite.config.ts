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
          // Put react and react-dom in the 'react' bundle
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'react';
          }
          
          // UI components in separate chunk
          if (id.includes('/components/ui/')) {
            return 'ui';
          }
          
          // Put third-party libraries in 'vendor' chunk
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          
          // Keep location-related components together
          if (id.includes('/components/location/')) {
            return 'location';
          }
          
          // For nested imports of common components, avoid too much chunking
          if (id.includes('/components/photoPoints/')) {
            return 'photoPoints';
          }
          
          // Return null for other modules to let Rollup handle them
          return null;
        }
      }
    },
    assetsDir: 'assets',
    copyPublicDir: true,
    // Add these optimization settings to prevent chunk loading failures
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    sourcemap: true,
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['lovable-tagger'],
    include: ['suncalc'],
  }
}));
