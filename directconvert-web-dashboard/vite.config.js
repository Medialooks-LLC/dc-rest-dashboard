import { defineConfig } from 'vite';

const directConvertTarget = process.env.DIRECTCONVERT_REST_TARGET || 'http://127.0.0.1:9753';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 9001,
    proxy: {
      '/dc-api': {
        target: directConvertTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dc-api/, '/api')
      }
    }
  }
});
