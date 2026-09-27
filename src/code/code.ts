import { Text } from '@codemirror/state'
import { Chunk } from '@codemirror/merge'
import { BLOCK_TYPES, type Category } from '../model/catalogue.ts'
import type { Block, Checkpoint, Files, Project } from '../model/types.ts'

const lines = (s: string) => Text.of(s.split(/\r?\n/))

export function changedLines(base: string | undefined, text: string): number[] {
  const b = lines(text)
  if (base === undefined) return Array.from({ length: b.lines }, (_, i) => i + 1)
  const out: number[] = []
  for (const c of Chunk.build(lines(base), b)) {
    if (c.toB <= c.fromB) continue // a pure deletion
    for (let n = b.lineAt(c.fromB).number; n <= b.lineAt(c.endB).number; n++) out.push(n)
  }
  return out
}

export function blockMarks(text: string): { line: number; id: string }[] {
  const seen = new Set<string>()
  const out: { line: number; id: string }[] = []
  text.split(/\r?\n/).forEach((l, i) => {
    for (const [, id] of l.matchAll(/data-block="([^"]*)"/g)) {
      if (seen.has(id)) continue
      seen.add(id)
      out.push({ line: i + 1, id })
    }
  })
  return out
}

function findLine(files: Files, needle: string): { file: string; line: number } | undefined {
  for (const [file, text] of Object.entries(files)) {
    const i = text.indexOf(needle)
    if (i >= 0) return { file, line: text.slice(0, i).split('\n').length }
  }
}

export function findBlockCode(files: Files, id: string): { file: string; line: number } | undefined {
  return findLine(files, `data-block="${id}"`) ?? findLine(files, `/* block ${id} */`)
}

export function blockInfo(id: string, project: Project, checkpoints: Checkpoint[]): { name: string; category: Category } | undefined {
  let b: Block | undefined = project.blocks[id]
  if (!b) {
    let newest = -Infinity
    for (const c of checkpoints) {
      const found = c.canvas.blocks[id]
      if (found && c.number > newest) { newest = c.number; b = found }
    }
  }
  if (!b || b.type === 'canvas') return undefined
  return { name: b.name, category: b.inst ? 'my' : BLOCK_TYPES[b.type].category }
}

// `name` comes trimmed and lower-cased.
export function newFileProblem(name: string, files: Files): string | null {
  if (!/^[a-z0-9][a-z0-9-]*\.(html|css|js)$/.test(name)) return 'Use a name like about.html, extra.css or games.js.'
  if (name in files) return `${name} already exists.`
  return null
}
