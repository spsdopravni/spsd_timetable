import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    proxy: {
      '/meteo': {
        target: 'http://10.0.10.208',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/meteo/, ''),
      },
      // Vercel serverless funkce (api/*.ts) lokálně neběží – při vývoji
      // a v `vite preview` (Raspberry Pi) se /api bere z produkce.
      // Přepsat lze přes VITE_API_PROXY_TARGET.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://timetable.brozovec.eu',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  // `vite preview` (spouští se na Raspberry Pi přes `npm run dev`) má mít
  // stejné proxy jako dev server – explicitně, aby to nezáviselo na defaultu.
  preview: {
    proxy: {
      '/meteo': {
        target: 'http://10.0.10.208',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/meteo/, ''),
      },
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://timetable.brozovec.eu',
        changeOrigin: true,
        secure: true,
      },
    },
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
        ecma: 2020,
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false,
      }
    },
    rollupOptions: {
      output: {
        // Pozor na react/jsx-runtime: v objektové podobě ho Rollup přiřadil
        // k prvnímu chunku, který si ho vyžádal — a to byl framer-motion.
        // Tabule pak parsovala 115 kB framer-motion, ze kterého nepoužije nic.
        // Funkční podoba rozhoduje podle cesty a cyklus mezi chunky nevznikne.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'animation';
          }
          if (/[\\/]node_modules[\\/](lucide-react|clsx|tailwind-merge)[\\/]/.test(id)) {
            return 'ui-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
  }
}));
