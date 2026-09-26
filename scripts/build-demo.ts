// One real Build with no browser: proves the key and the endpoint (TDD §5.4).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { agentHandler, bobModel, createLimits } from '../api/agent.ts'
import { readAgentStream } from '../src/agent.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // no .env: use the environment as it is
}
if (!process.env.AGENT_API_KEY) throw new Error('AGENT_API_KEY is not set. Add it to .env.')

const document = readFileSync('scripts/demo-instructions.md', 'utf8')
const handler = agentHandler(bobModel, createLimits())
const started = Date.now()
console.log(`Building the demo with ${process.env.AGENT_MODEL || 'the default model'}…`)
const res = await handler(
  new Request('http://localhost/api/agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind: 'build', document, files: {} }),
  }),
)

const CUPCAKES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#F7D6E0"/><text x="600" y="420" font-family="sans-serif" font-size="64" text-anchor="middle" fill="#7A3B52">Cupcakes</text></svg>\n`

for await (const event of readAgentStream(res)) {
  if (event.type === 'block') console.log(`${Math.round((Date.now() - started) / 1000)} s  Building ${event.id}`)
  if (event.type === 'error') {
    console.log(`The Build failed: ${event.reason}`)
    process.exit(1)
  }
  if (event.type === 'files') {
    const dir = resolve('tmp/demo-site')
    rmSync(dir, { recursive: true, force: true })
    const written: string[] = []
    for (const [path, text] of Object.entries(event.files)) {
      const target = resolve(dir, path)
      if (!target.startsWith(dir + sep)) continue // leaves the folder
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, text)
      written.push(path)
    }
    mkdirSync(resolve(dir, 'assets'), { recursive: true })
    writeFileSync(resolve(dir, 'assets/cupcakes.svg'), CUPCAKES)
    console.log(`Done: ${written.join(', ')} in tmp/demo-site/`)
  }
}
