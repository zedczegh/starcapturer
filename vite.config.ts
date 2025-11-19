
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
          // Core React and routing
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-core';
          }
          // UI components library
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Leaflet and mapping
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'maps';
          }
          // Three.js and 3D
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-js';
          }
          // Chart libraries
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // Heavy utilities
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/lodash')) {
            return 'utils';
          }
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        }
      }
    },
    assetsDir: 'assets',
    copyPublicDir: true,
    chunkSizeWarningLimit: 1000,
    // Use Vite's default esbuild minifier for better compatibility
    minify: 'esbuild',
  },
  optimizeDeps: {
    exclude: ['lovable-tagger'],
    include: ['suncalc', 'react', 'react-dom', 'react-router-dom'],
  }
}));
