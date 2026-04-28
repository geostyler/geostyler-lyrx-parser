import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/LyrxStyleParser.ts'),
      formats: ['es'],
      fileName: 'LyrxStyleParser',
    },
    rollupOptions: {
      external: ['geostyler-style', 'jimp'],
      output: {
        dir: 'dist',
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        externalLiveBindings: false,
      },
    },
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
