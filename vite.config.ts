import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/LyrxParser.ts']
    })
  ],
  build: {
    lib: {
      name: 'geostyler-lyrx-parser',
      fileName: 'main',
      entry: resolve(__dirname, 'src/LyrxParser.ts'),
      formats: ['es', 'umd'],
    }
  }
});
