// Deploy-check runner. Reads files, runs git and runs pnpm.
// Run with: node scripts/check.ts
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { scanFile, scanBundle, scanHistory, checkRepo } from './guard.ts'
import type { Finding } from './guard.ts'

// ── Step 1: read AGENT_API_KEY from .env ───────────────────────────────────

function readEnvKey(): string {
  try {
    const text = readFileSync('.env', 'utf8')
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('AGENT_API_KEY=')) {
        const val = line.slice('AGENT_API_KEY='.length).trim().replace(/^["']|["']$/g, '')
        return val.length >= 8 ? val : ''
      }
    }
  } catch {
    // .env missing
  }
  return ''
}

const envKey = readEnvKey()

// ── Step 2: collect tracked + untracked files ──────────────────────────────

function getTrackedFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
  return out.split('\0').filter(p => p.length > 0 && existsSync(p))
}

function isBinary(buf: Buffer): boolean {
  const check = buf.subarray(0, 8000)
  for (let i = 0; i < check.length; i++) {
    if (check[i] === 0) return true
  }
  return false
}

function readText(path: string): string {
  try {
    const buf = readFileSync(path)
    if (isBinary(buf)) return ''
    return buf.toString('utf8')
  } catch {
    return ''
  }
}

const files = getTrackedFiles()

// ── Scan files + repo ──────────────────────────────────────────────────────

const allFindings: Finding[] = []

for (const f of files) {
  if (f === 'pnpm-lock.yaml') continue
  const text = readText(f)
  if (!text) continue
  allFindings.push(...scanFile(f, text, envKey))
}

// checkRepo uses readFileSync directly for the config files
const repoRead = (path: string): string => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}
allFindings.push(...checkRepo(files, repoRead))

// History scan
const gitLog = execFileSync('git', ['log', '-p', '--all', '--no-color', '--format=commit %H'], {
  encoding: 'utf8',
  maxBuffer: 1 << 28,
})
allFindings.push(...scanHistory(gitLog, envKey))

// ── Step 3: report findings before build ──────────────────────────────────

if (allFindings.length > 0) {
  console.log('Deploy checks')
  for (const f of allFindings) {
    console.log(`✗ ${f.at}  ${f.problem}`)
  }
  console.log(`Problems found: ${allFindings.length}. Fix them before you push.`)
  process.exit(1)
}

// ── Step 4: typecheck, test, build, build:preview ─────────────────────────

const pnpmScripts = ['typecheck', 'test', 'build', 'build:preview']
for (const script of pnpmScripts) {
  const result = spawnSync(`pnpm ${script}`, { stdio: 'inherit', shell: true })
  if (result.status !== 0) {
    console.log(`✗ pnpm ${script}  failed`)
    process.exit(1)
  }
}

// ── Step 5: scan build outputs ─────────────────────────────────────────────

const requiredOutputs = ['dist/index.html', 'dist-preview/index.html', 'dist-preview/sw.js']
const bundleFindings: Finding[] = []

for (const p of requiredOutputs) {
  if (!existsSync(p)) {
    bundleFindings.push({ at: p, problem: 'is missing after the build' })
  }
}

function walkDir(dir: string): string[] {
  const result: string[] = []
  if (!existsSync(dir)) return result
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      result.push(...walkDir(full))
    } else {
      result.push(full.replace(/\\/g, '/'))
    }
  }
  return result
}

for (const dir of ['dist', 'dist-preview']) {
  for (const f of walkDir(dir)) {
    const text = readText(f)
    if (!text) continue
    bundleFindings.push(...scanBundle(f, text, envKey))
  }
}

if (bundleFindings.length > 0) {
  console.log('Deploy checks')
  for (const f of bundleFindings) {
    console.log(`✗ ${f.at}  ${f.problem}`)
  }
  console.log(`Problems found: ${bundleFindings.length}. Fix them before you push.`)
  process.exit(1)
}

// ── Step 6: all clear ──────────────────────────────────────────────────────

console.log('✓ All deploy checks passed.')
process.exit(0)
