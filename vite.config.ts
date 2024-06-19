import { defineConfig } from 'vite';
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    manifest: true,
    lib: {
      entry: './src/LyrxParser.ts',
      name: 'GeoStylerLyrxParser',
      formats: ['es', 'iife'],
      fileName: 'LyrxParser',
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        dir: 'dist',
        exports: 'named',
        generatedCode: 'es5',
        format: 'iife',
      },
    },
  },
  server: {
    host: '0.0.0.0'
  }
});
