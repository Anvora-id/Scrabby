import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// The Preview origin (TDD §13). sw.js keeps a fixed name so the shell can register it.
export default defineConfig({
  root: here('.'),
  server: { port: 5174, strictPort: true },
  build: {
    outDir: here('../dist-preview'),
    emptyOutDir: true,
    rolldownOptions: {
      input: { index: here('index.html'), sw: here('sw.ts') },
      output: { entryFileNames: c => (c.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js') },
    },
  },
})
