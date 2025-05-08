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
          // Core React in a dedicated chunk
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          
          // React router in its own chunk
          if (id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/')) {
            return 'router';
          }
          
          // Map libraries in separate chunk
          if (id.includes('node_modules/leaflet') ||
              id.includes('node_modules/react-leaflet')) {
            return 'map-vendor';
          }
          
          // UI components in separate chunk
          if (id.includes('/components/ui/')) {
            return 'ui';
          }
          
          // All other third-party libraries in vendor chunk
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

          // Keep profile components together
          if (id.includes('/components/profile/') || 
              id.includes('/components/astro-spots/profile/')) {
            return 'profile';
          }
        },
        // Ensure chunk filenames are predictable for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      }
    },
    assetsDir: 'assets',
    copyPublicDir: true,
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps in production for better performance
    target: 'esnext',
    // Ensure HTML is properly cached
    cssCodeSplit: true,
    cssMinify: true,
  },
  optimizeDeps: {
    include: ['suncalc', 'leaflet', 'react-leaflet', '@supabase/supabase-js'],
    exclude: ['lovable-tagger'],
  },
  // Ensure HTML is properly cached
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      return { relative: true };
    }
  }
}));
