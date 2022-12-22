import * as path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  // root: path.join(__dirname, 'src', 'main'),
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: path.join(__dirname, 'src', 'index.ts'),
      },
    },
    lib: {
      entry: path.join(__dirname, 'src', 'index.ts'),
      name: 'index',
      formats: ['cjs'],
      // fileName: (format) => `main.${format}.js`,
      fileName: () => `index.js`,
    },
    outDir: path.join(__dirname, 'build'),
    minify: false,
    ssr: true,
    // emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    tsconfigPaths(),
    dts({
      entryRoot: path.join(__dirname, 'src'),
      // outputDir: path.join(__dirname, 'build', 'types'),
    }),
  ],
})
