// Tests for scripts/guard.ts
// Fake secrets are built at runtime — never written as one literal.
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  secretsIn,
  scanFile,
  scanBundle,
  scanHistory,
  checkRepo,
} from './guard.ts'

// ── Fake secrets built at runtime ─────────────────────────────────────────

const fakeGoogle = 'AIza' + 'B'.repeat(35)
const fakeOpenAI = 'sk-' + 'A'.repeat(25)
const fakeGitHub = 'ghp_' + 'A'.repeat(36)
const fakeAWS = 'AKIA' + '0'.repeat(16)
const fakeSlack = 'xoxb-' + 'A'.repeat(20)
const fakePrivKey = '-----BEGIN ' + 'PRIVATE KEY-----'
const fakeBearer = 'Bearer ' + 'A'.repeat(16)
const fakeApiKey = "api_key: '" + 'Aa1'.repeat(6) + "'"  // has digit
const fakeVite = 'VITE_' + 'BOB_KEY'
const fakeScratch = 'Scr' + 'atch'
const fakeEnvKey = 'TestEnvK' + 'ey_9999'  // >= 8 chars, looks nothing like a real key

// ── secretsIn ─────────────────────────────────────────────────────────────

describe('secretsIn', () => {
  it('finds each STRONG rule', () => {
    expect(secretsIn(fakeGoogle, '', true)).toContain('Google API key')
    expect(secretsIn(fakeOpenAI, '', true)).toContain('OpenAI-style key')
    expect(secretsIn(fakeGitHub, '', true)).toContain('GitHub token')
    expect(secretsIn(fakeAWS, '', true)).toContain('AWS key')
    expect(secretsIn(fakeSlack, '', true)).toContain('Slack token')
    expect(secretsIn(fakePrivKey, '', true)).toContain('private key')
  })

  it('finds each LOOSE rule when loose=true', () => {
    expect(secretsIn(fakeBearer, '', true)).toContain('credential in a header')
    expect(secretsIn(fakeApiKey, '', true)).toContain('credential in a string')
  })

  it('skips LOOSE rules when loose=false', () => {
    expect(secretsIn(fakeBearer, '', false)).not.toContain('credential in a header')
    expect(secretsIn(fakeApiKey, '', false)).not.toContain('credential in a string')
  })

  it('finds the env key', () => {
    expect(secretsIn(fakeEnvKey, fakeEnvKey, true)).toContain('the AGENT_API_KEY from .env')
  })

  it('ignores env key when empty', () => {
    expect(secretsIn(fakeEnvKey, '', true)).not.toContain('the AGENT_API_KEY from .env')
  })

  it('does not match safe patterns', () => {
    expect(secretsIn('apiKey: process.env.AGENT_API_KEY', '', true)).toHaveLength(0)
    expect(secretsIn('authorization: `${scheme} ${key}`', '', true)).toHaveLength(0)
    expect(secretsIn('authorization: Apikey $BOB_KEY', '', true)).toHaveLength(0)
    // "variableName.definition" has no digits so the credential-in-a-string pattern skips it
    expect(secretsIn("token: 'variableName.definition'", '', true)).toHaveLength(0)
    expect(secretsIn('Basic internationalization', '', true)).toHaveLength(0)
  })
})

// ── scanFile ───────────────────────────────────────────────────────────────

describe('scanFile', () => {
  it('never puts the fake into the JSON-serialised findings', () => {
    const res = scanFile('src/x.ts', `const k = "${fakeGoogle}"`, '')
    expect(JSON.stringify(res)).not.toContain(fakeGoogle)
  })

  it('finds an extra VITE_ name', () => {
    const findings = scanFile('src/x.ts', `import.meta.env.${fakeVite}`, '')
    expect(findings.some(f => f.problem.startsWith(fakeVite + ':'))).toBe(true)
  })

  it('does not flag the two allowed VITE_ names', () => {
    const findings = scanFile('src/x.ts', 'import.meta.env.VITE_PREVIEW_ORIGIN + import.meta.env.VITE_APP_ORIGIN', '')
    expect(findings.some(f => f.problem.includes('VITE_'))).toBe(false)
  })

  it('does not flag VITE_ in a .md file', () => {
    const findings = scanFile('docs/x.md', `see ${fakeVite}`, '')
    expect(findings.some(f => f.problem.includes('VITE_'))).toBe(false)
  })

  it('finds "Scratch" in src/ product code', () => {
    const findings = scanFile('src/x.ts', `// built on ${fakeScratch}`, '')
    expect(findings.some(f => f.problem.includes('Scratch'))).toBe(true)
  })

  it('finds "Scratch" in a skill file', () => {
    const findings = scanFile('skills/x/SKILL.md', `made on ${fakeScratch}`, '')
    expect(findings.some(f => f.problem.includes('Scratch'))).toBe(true)
  })

  it('does not find "Scratch" in docs/', () => {
    const findings = scanFile('docs/x.md', `it uses ${fakeScratch}`, '')
    expect(findings.some(f => f.problem.includes('Scratch'))).toBe(false)
  })

  it('does not flag "remade from scratch" in src/', () => {
    const findings = scanFile('src/checkpoints.ts', 'remade from scratch', '')
    expect(findings.some(f => f.problem.includes('Scratch'))).toBe(false)
  })

  it('finds a console.log with headers in api/', () => {
    const findings = scanFile('api/agent.ts', "console.log('req', req.headers)", '')
    expect(findings.some(f => f.problem.includes('may log'))).toBe(true)
  })

  it('finds an outside script in index.html', () => {
    const findings = scanFile('index.html', '<script src="https://cdn.example.com/x.js">', '')
    expect(findings.some(f => f.problem.includes('cdn.example.com'))).toBe(true)
  })

  it('does not flag the Google Fonts link in index.html', () => {
    const findings = scanFile('index.html', '<link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">', '')
    expect(findings.some(f => f.problem.includes('loads an outside file'))).toBe(false)
  })
})

// ── scanBundle ─────────────────────────────────────────────────────────────

describe('scanBundle', () => {
  it('finds a STRONG fake in a bundle', () => {
    const findings = scanBundle('dist/index.html', `var k="${fakeGoogle}"`, '')
    expect(findings.some(f => f.problem.includes('Google API key'))).toBe(true)
  })

  it('finds the env key in a bundle', () => {
    const findings = scanBundle('dist/assets/main.js', fakeEnvKey, fakeEnvKey)
    expect(findings.some(f => f.problem.includes('the AGENT_API_KEY from .env'))).toBe(true)
  })

  it('does not flag a LOOSE-only line in a bundle', () => {
    const findings = scanBundle('dist/assets/main.js', fakeBearer, '')
    expect(findings.some(f => f.problem.includes('credential in a header'))).toBe(false)
  })
})

// ── scanHistory ────────────────────────────────────────────────────────────

describe('scanHistory', () => {
  const sha = 'abcdef1234567'
  const logWithAdd = `commit ${sha}\n+++ b/src/secret.ts\n+const k = "${fakeGoogle}"\n`
  const logWithRemove = `commit ${sha}\n+++ b/src/secret.ts\n-const k = "${fakeGoogle}"\n`
  const logWithLock = `commit ${sha}\n+++ b/pnpm-lock.yaml\n+${fakeGoogle}\n`

  it('finds a fake on a + line', () => {
    const findings = scanHistory(logWithAdd, '')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].at).toBe(`commit ${sha.slice(0, 7)} src/secret.ts`)
    expect(findings[0].problem).toContain('git history')
  })

  it('ignores a fake on a - line', () => {
    expect(scanHistory(logWithRemove, '')).toHaveLength(0)
  })

  it('ignores pnpm-lock.yaml', () => {
    expect(scanHistory(logWithLock, '')).toHaveLength(0)
  })
})

// ── checkRepo ──────────────────────────────────────────────────────────────

describe('checkRepo', () => {
  it('passes on the real repo files', () => {
    const realFiles = ['package.json', 'vercel.json', '.gitignore', '.bobignore', '.env.example', 'api/agent.ts']
    const read = (path: string): string => {
      try { return readFileSync(path, 'utf8') } catch { return '' }
    }
    const findings = checkRepo(realFiles, read)
    expect(findings).toHaveLength(0)
  })

  it('flags notes-secret.txt', () => {
    const findings = checkRepo(['notes-secret.txt'], () => '')
    expect(findings.some(f => f.at === 'notes-secret.txt' && f.problem === 'must never be committed')).toBe(true)
  })

  it('flags .env', () => {
    const findings = checkRepo(['.env'], () => '')
    expect(findings.some(f => f.at === '.env')).toBe(true)
  })

  it('flags .env.local', () => {
    const findings = checkRepo(['.env.local'], () => '')
    expect(findings.some(f => f.at === '.env.local')).toBe(true)
  })

  it('does not flag .env.example', () => {
    const findings = checkRepo(['.env.example'], (p) => {
      if (p === '.env.example') return 'AGENT_API_KEY=\n'
      return ''
    })
    expect(findings.some(f => f.at === '.env.example' && f.problem === 'must never be committed')).toBe(false)
  })

  it('does not flag SECURITY.md', () => {
    const findings = checkRepo(['SECURITY.md'], () => '')
    expect(findings.some(f => f.at === 'SECURITY.md' && f.problem === 'must never be committed')).toBe(false)
  })

  it('flags an extra api/ file', () => {
    const findings = checkRepo(['api/extra.ts'], () => '')
    expect(findings.some(f => f.at === 'api/extra.ts')).toBe(true)
  })

  it('flags an extra dependency', () => {
    const read = (path: string) => {
      if (path === 'package.json') {
        return JSON.stringify({ dependencies: { react: '^19.3.0', 'lodash': '^4.0.0' }, devDependencies: {} })
      }
      try { return readFileSync(path, 'utf8') } catch { return '' }
    }
    const findings = checkRepo(['package.json'], read)
    expect(findings.some(f => f.at === 'package.json' && f.problem.includes('lodash'))).toBe(true)
  })

  it('flags a .env.example with a value', () => {
    const read = (path: string) => {
      if (path === '.env.example') return 'AGENT_API_KEY=somevalue\n'
      try { return readFileSync(path, 'utf8') } catch { return '' }
    }
    const findings = checkRepo(['.env.example'], read)
    expect(findings.some(f => f.at === '.env.example:1' && f.problem === 'must keep every value empty')).toBe(true)
  })

  it('flags a vercel.json with another maxDuration', () => {
    const read = (path: string) => {
      if (path === 'vercel.json') return '{"functions":{"api/agent.ts":{"maxDuration":60,"includeFiles":"skills/**"}}}'
      try { return readFileSync(path, 'utf8') } catch { return '' }
    }
    const findings = checkRepo(['vercel.json'], read)
    expect(findings.some(f => f.at === 'vercel.json')).toBe(true)
  })

  it('flags a .gitignore missing the .env line', () => {
    const read = (path: string) => {
      if (path === '.gitignore') return 'node_modules/\ndist/\ndist-preview/\ntmp/\n.vercel/\n.DS_Store\nThumbs.db\n.vscode/\n.idea/\n.env.*\n!.env.example\n'
      try { return readFileSync(path, 'utf8') } catch { return '' }
    }
    const findings = checkRepo(['.gitignore'], read)
    expect(findings.some(f => f.at === '.gitignore' && f.problem === 'lost the line .env')).toBe(true)
  })
})
