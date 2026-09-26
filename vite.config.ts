/// <reference types="vitest/config" />
import { Readable } from 'node:stream'
import { defineConfig, createServer, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function previewServer(): Plugin {
  return {
    name: 'preview-server',
    apply: (_, { command }) => command === 'serve' && !process.env.VITEST,
    async configureServer(server) {
      const preview = await createServer({ configFile: 'preview/vite.config.ts' })
      await preview.listen()
      preview.printUrls()
      server.httpServer?.on('close', () => preview.close())
    },
  }
}

function agentApi(): Plugin {
  return {
    name: 'agent-api',
    apply: 'serve',
    configureServer(server) {
      const { root, mode } = server.config
      Object.assign(process.env, loadEnv(mode, root, ['AGENT_']))
      server.middlewares.use('/api/agent', async (req, res, next) => {
        try {
          const abort = new AbortController()
          res.on('close', () => abort.abort())
          const mod = await server.ssrLoadModule('/api/agent.ts') // reloaded on edit: no restart needed
          const response: Response = await mod.default.fetch(
            new Request(new URL(req.originalUrl ?? '/api/agent', 'http://localhost'), {
              method: req.method,
              headers: req.headers as Record<string, string>,
              body: req.method === 'POST' ? (Readable.toWeb(req) as ReadableStream) : undefined,
              duplex: 'half',
              signal: abort.signal,
            } as RequestInit),
          )
          res.writeHead(response.status, Object.fromEntries(response.headers))
          if (response.body) for await (const chunk of response.body) res.write(chunk)
          res.end()
        } catch (e) {
          if (res.headersSent) res.end()
          else next(e)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), previewServer(), agentApi()],
  server: { port: 5173, strictPort: true },
  // Agent worktrees in hidden folders hold copies of the tests.
  test: { exclude: ['**/node_modules/**', '.*/**'] },
})
