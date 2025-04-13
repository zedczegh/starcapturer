
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Code protection options
    minify: true,
    sourcemap: false, // Disable source maps in production to protect code
    rollupOptions: {
      output: {
        // Improve chunk splitting for better caching and protection
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@/components/ui'],
          'siqs-core': ['@/lib/siqs'],
        }
      }
    }
  },
  define: {
    // Add build timestamp for versioning
    '__BUILD_TIMESTAMP__': JSON.stringify(new Date().toISOString()),
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0'),
  }
}));
