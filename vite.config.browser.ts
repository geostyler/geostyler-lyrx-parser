import { defineConfig } from 'vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Jimp's ESM build relies on Node builtins (buffer, zlib, stream, ...).
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      // jimp@1.6.1 ships an empty browser bundle, so build from its ESM output instead.
      // See https://github.com/jimp-dev/jimp/issues/1402
      jimp: path.resolve(__dirname, 'node_modules/jimp/dist/esm/index.js'),
    },
  },
  build: {
    manifest: true,
    lib: {
      entry: './src/LyrxStyleParser.ts',
      name: 'GeoStylerLyrxParser',
      formats: ['iife'],
      fileName: 'lyrxStyleParser',
    },
    rollupOptions: {
      output: {
        dir: 'dist',
        exports: 'named',
        generatedCode: 'es5',
        format: 'iife',
      },
    },
    sourcemap: true,
  },
  define: {
    appName: 'GeoStyler'
  },
  server: {
    host: '0.0.0.0'
  }
});
