import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', 'react-icons']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Prevent build issues during deployment
    emptyOutDir: true,
    minify: 'esbuild'
  },
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    open: true,
    // Prevent dev server conflicts during deployment
    strictPort: false
  },
  preview: {
    port: 4173,
    strictPort: false
  },
  // Optimize for deployment stability
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  }
});