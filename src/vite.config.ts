
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
    react({
      // Using standard React plugin options without fastRefresh
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable build optimizations
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    assetsInlineLimit: 4096, // 4kb
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@/components/ui'],
          vendor: ['suncalc'],
          framer: ['framer-motion'],
          map: ['leaflet', 'react-leaflet'],
          utils: ['date-fns', 'lodash'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers/zod'],
          tanstack: ['@tanstack/react-query'],
        }
      }
    },
    assetsDir: 'assets',
    copyPublicDir: true, // Ensures public directory is copied to dist
    sourcemap: mode === 'development',
    reportCompressedSize: false, // Speed up builds
  },
  optimizeDeps: {
    exclude: ['lovable-tagger'],
    include: [
      'suncalc', 
      'react-router-dom',
      'react-leaflet',
      'framer-motion',
      '@tanstack/react-query'
    ],
    esbuildOptions: {
      target: 'es2020',
      // Improve JSX transform
      jsx: 'automatic',
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  }
}));
