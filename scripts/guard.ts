// Pure rules for the deploy checks (no file system, no git, no process).
// scripts/check.ts is the only file that calls the scanner functions.

export type Finding = { at: string; problem: string }

// ── Secret patterns ────────────────────────────────────────────────────────

export const STRONG: [string, RegExp][] = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
]

// Only for source files and history: minified bundles have too many token-like strings.
export const LOOSE: [string, RegExp][] = [
  ['credential in a header', /\b(Bearer|Apikey)\s+[A-Za-z0-9_\-.+/=]{16,}/],
  ['credential in a string', /(api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'`](?=[^"'`]*\d)[A-Za-z0-9_\-.+/=]{16,}["'`]/i],
]

/** Returns names of matching rules. Never returns the matched text. */
export function secretsIn(line: string, envKey: string, loose: boolean): string[] {
  const names: string[] = []
  for (const [name, re] of STRONG) {
    if (re.test(line)) names.push(name)
  }
  if (loose) {
    for (const [name, re] of LOOSE) {
      if (re.test(line)) names.push(name)
    }
  }
  if (envKey && line.includes(envKey)) {
    names.push('the AGENT_API_KEY from .env')
  }
  return names
}

// ── File scanner ───────────────────────────────────────────────────────────

export function scanFile(path: string, text: string, envKey: string): Finding[] {
  const findings: Finding[] = []
  const lines = text.split(/\r?\n/)
  const isHtml = path.endsWith('.html')
  const isCss = path.endsWith('.css')
  const isMd = path.endsWith('.md')
  const isProduct = /^(src|preview|public|skills|api)\//.test(path) || path === 'index.html'
  const isSourceCode = path.startsWith('src/') || path.startsWith('api/')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const at = `${path}:${i + 1}`

    // Rule 1: secrets
    for (const name of secretsIn(line, envKey, true)) {
      findings.push({ at, problem: `looks like a secret (${name})` })
    }

    // Rule 2: extra VITE_ names (not in .md files)
    if (!isMd) {
      const viteRe = /\bVITE_[A-Z0-9_]+/g
      let m: RegExpExecArray | null
      while ((m = viteRe.exec(line)) !== null) {
        const name = m[0]
        if (name !== 'VITE_PREVIEW_ORIGIN' && name !== 'VITE_APP_ORIGIN') {
          findings.push({ at, problem: `${name}: only VITE_PREVIEW_ORIGIN and VITE_APP_ORIGIN may use VITE_ (Vite puts them in the browser bundle)` })
        }
      }
    }

    // Rule 3: "Scratch" in product code (case-sensitive)
    if (isProduct && /\bScratch\b/.test(line)) {
      findings.push({ at, problem: 'uses the word "Scratch" in the product' })
    }

    // Rule 4: may log a key or headers (source files only)
    if (isSourceCode && /console\.\w+\(.*(AGENT_API_KEY|apiKey|authorization|headers)/i.test(line)) {
      findings.push({ at, problem: 'may log a key or request headers' })
    }

    // Rule 5: outside files
    if (isHtml) {
      const hostRe = /(?:src|href)=["'](?:https?:)?\/\/([^/"'?#]+)/gi
      let hm: RegExpExecArray | null
      while ((hm = hostRe.exec(line)) !== null) {
        const host = hm[1]
        if (host !== 'fonts.googleapis.com' && host !== 'fonts.gstatic.com') {
          findings.push({ at, problem: `loads an outside file from ${host}` })
        }
      }
    }
    if (isCss) {
      const importRe = /@import\s+(?:url\()?["']?(?:https?:)?\/\/([^/"')?#]+)/gi
      let im: RegExpExecArray | null
      while ((im = importRe.exec(line)) !== null) {
        const host = im[1]
        if (host !== 'fonts.googleapis.com' && host !== 'fonts.gstatic.com') {
          findings.push({ at, problem: `loads an outside file from ${host}` })
        }
      }
    }
  }

  return findings
}

// ── Bundle scanner (no LOOSE rules) ───────────────────────────────────────

export function scanBundle(path: string, text: string, envKey: string): Finding[] {
  const findings: Finding[] = []
  const lines = text.split(/\r?\n/)
  const isHtml = path.endsWith('.html')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const at = `${path}:${i + 1}`

    // Secrets (STRONG only, not LOOSE)
    for (const name of secretsIn(line, envKey, false)) {
      findings.push({ at, problem: `looks like a secret (${name})` })
    }

    // Rule 5 for .html files
    if (isHtml) {
      const hostRe = /(?:src|href)=["'](?:https?:)?\/\/([^/"'?#]+)/gi
      let hm: RegExpExecArray | null
      while ((hm = hostRe.exec(line)) !== null) {
        const host = hm[1]
        if (host !== 'fonts.googleapis.com' && host !== 'fonts.gstatic.com') {
          findings.push({ at, problem: `loads an outside file from ${host}` })
        }
      }
    }
  }

  return findings
}

// ── History scanner ────────────────────────────────────────────────────────

export function scanHistory(log: string, envKey: string): Finding[] {
  const findings: Finding[] = []
  const lines = log.split(/\r?\n/)
  let sha = ''
  let filePath = ''

  for (const line of lines) {
    if (line.startsWith('commit ')) {
      sha = line.slice(7, 14) // 7-char sha
      filePath = ''
    } else if (line.startsWith('+++ b/')) {
      filePath = line.slice(6)
    } else if (line.startsWith('+++ ')) {
      filePath = '' // +++ /dev/null
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      if (!filePath || filePath === 'pnpm-lock.yaml') continue
      const content = line.slice(1)
      for (const name of secretsIn(content, envKey, true)) {
        findings.push({ at: `commit ${sha} ${filePath}`, problem: `looks like a secret (${name}) in the git history` })
      }
    }
  }

  return findings
}

// ── Repo-level checks ──────────────────────────────────────────────────────

export const DEPENDENCIES: Record<string, string> = {
  '@codemirror/commands': '^6.11.1',
  '@codemirror/lang-css': '^6.3.1',
  '@codemirror/lang-html': '^6.4.12',
  '@codemirror/lang-javascript': '^6.2.5',
  '@codemirror/language': '^6.12.4',
  '@codemirror/merge': '^6.12.2',
  '@codemirror/state': '^6.7.6',
  '@codemirror/view': '^6.43.13',
  '@lezer/highlight': '^1.2.4',
  '@phosphor-icons/react': '^2.1.10',
  'fflate': '^0.8.3',
  'idb': '^8.0.3',
  'react': '^19.3.0',
  'react-dom': '^19.3.0',
}

export const DEV_DEPENDENCIES: Record<string, string> = {
  '@types/node': '^26.6.2',
  '@types/react': '^19.3.0',
  '@types/react-dom': '^19.3.0',
  '@vitejs/plugin-react': '^6.1.1',
  'typescript': '^7.0.2',
  'vite': '^8.3.1',
  'vitest': '^5.0.2',
}

const EXPECTED_VERCEL_JSON = '{"functions":{"api/agent.ts":{"maxDuration":300,"includeFiles":"skills/**"}}}'

const GITIGNORE_LINES = [
  '.env',
  '.env.*',
  '!.env.example',
  'node_modules/',
  'dist/',
  'dist-preview/',
  'tmp/',
  '.vercel/',
  '.DS_Store',
  'Thumbs.db',
  '.vscode/',
  '.idea/',
]

const BOBIGNORE_LINES = [
  '.env',
  '.env.*',
  '!.env.example',
]

export function checkRepo(files: string[], read: (path: string) => string): Finding[] {
  const findings: Finding[] = []

  for (const f of files) {
    const name = f.includes('/') ? f.slice(f.lastIndexOf('/') + 1) : f

    // Rule 1: sensitive file names
    if (
      name === '.env' ||
      name.startsWith('.env.') ||
      name.toLowerCase().includes('secret') ||
      name.toLowerCase().includes('credential') ||
      name.toLowerCase().includes('password')
    ) {
      // .env.example is explicitly excluded
      if (name !== '.env.example') {
        findings.push({ at: f, problem: 'must never be committed' })
      }
    }

    // Rule 2: extra files in api/
    if (f.startsWith('api/') && f !== 'api/agent.ts' && f !== 'api/agent.test.ts') {
      findings.push({ at: f, problem: 'is not allowed in api/: Vercel makes every file there a function' })
    }
  }

  // Rule 3: package.json dependencies
  const pkgText = read('package.json')
  if (pkgText) {
    let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    try {
      pkg = JSON.parse(pkgText) as typeof pkg
    } catch {
      pkg = {}
    }
    const checkDeps = (actual: Record<string, string> | undefined, expected: Record<string, string>) => {
      const a = actual ?? {}
      const allKeys = new Set([...Object.keys(a), ...Object.keys(expected)])
      for (const key of allKeys) {
        if (a[key] !== expected[key]) {
          findings.push({ at: 'package.json', problem: `${key} differs from TDD §1 (a new dependency needs a human's yes)` })
        }
      }
    }
    checkDeps(pkg.dependencies, DEPENDENCIES)
    checkDeps(pkg.devDependencies, DEV_DEPENDENCIES)
  }

  // Rule 4: vercel.json
  const vercelText = read('vercel.json')
  let vercelOk = false
  if (vercelText) {
    try {
      const parsed = JSON.parse(vercelText) as unknown
      vercelOk = JSON.stringify(parsed) === EXPECTED_VERCEL_JSON
    } catch {
      vercelOk = false
    }
  }
  if (!vercelOk) {
    findings.push({ at: 'vercel.json', problem: 'differs from TDD §1' })
  }

  // Rule 5: .gitignore and .bobignore required lines
  const gitignoreText = read('.gitignore')
  const gitignoreLines = gitignoreText.split(/\r?\n/).map(l => l.trim())
  for (const required of GITIGNORE_LINES) {
    if (!gitignoreLines.includes(required)) {
      findings.push({ at: '.gitignore', problem: `lost the line ${required}` })
    }
  }

  const bobignoreText = read('.bobignore')
  const bobignoreLines = bobignoreText.split(/\r?\n/).map(l => l.trim())
  for (const required of BOBIGNORE_LINES) {
    if (!bobignoreLines.includes(required)) {
      findings.push({ at: '.bobignore', problem: `lost the line ${required}` })
    }
  }

  // Rule 6: .env.example values must be empty
  const envExampleText = read('.env.example')
  if (envExampleText) {
    const envLines = envExampleText.split(/\r?\n/)
    for (let i = 0; i < envLines.length; i++) {
      const line = envLines[i].trim()
      if (line === '' || line.startsWith('#')) continue
      if (!/^[A-Z0-9_]+=$/.test(line)) {
        findings.push({ at: `.env.example:${i + 1}`, problem: 'must keep every value empty' })
      }
    }
  }

  return findings
}
