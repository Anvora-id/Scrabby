// Splits TDD.md, DESIGN.md and PRD.md into one small file per section under spec/, so a Bob task reads only the
// sections its issue names instead of whole 50–150 KB documents. The big files stay the source: edit them, then run
// `node scripts/split-specs.mjs`. Never edit spec/ by hand.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Top-level `## ` headings outside code fences. `id(title)` names a section's file, or null to keep it in the previous one.
function split(src, dir, id) {
  const text = readFileSync(src, 'utf8').replace(/\r\n/g, '\n')
  const parts = [{ name: 'intro', lines: [] }]
  let fence = false
  for (const line of text.split('\n')) {
    if (/^(```|~~~)/.test(line)) fence = !fence
    const h = !fence && line.match(/^## (.+)$/)
    const name = h && id(h[1])
    if (name) parts.push({ name, lines: [] })
    parts.at(-1).lines.push(line)
  }
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const p of parts) writeFileSync(`${dir}/${p.name}.md`, `<!-- Generated from ${src} by scripts/split-specs.mjs. Do not edit. -->\n${p.lines.join('\n').trim()}\n`)
  return parts.map(p => p.name)
}

// TDD and PRD: "## 8. Canvas…" → 08.md, "## 20a. …" → 20a.md, "## Appendix A. …" → appendix-a.md.
// Other `## ` lines (inside a section's quoted text) stay in their section.
const numbered = title => {
  const n = title.match(/^(\d+)([a-z]?)\. /)
  if (n) return n[1].padStart(2, '0') + n[2]
  const a = title.match(/^Appendix ([A-Z])\. /)
  return a ? `appendix-${a[1].toLowerCase()}` : null
}

const out = {
  tdd: split('TDD.md', 'spec/tdd', numbered),
  prd: split('PRD.md', 'spec/prd', numbered),
  design: split('DESIGN.md', 'spec/design', slug),
}
for (const [k, names] of Object.entries(out)) console.log(`spec/${k}: ${names.join(', ')}`)
