import headerFile from '../../skills/instruction-header.md?raw'
import { BLOCK_TYPES, BUILT_PAGE, COLOR_PRESETS, TRAIT_TYPES } from '../model/catalogue.ts'
import type { Block, Project, Trait } from '../model/types.ts'
import { blockLabel, pagesOf, parseAction, popupsIn, topBlock, warnings } from './warnings.ts'

const [HEADER, EXTRA_LINE] = [...headerFile.replace(/\r\n/g, '\n').matchAll(/```markdown\n([\s\S]*?)```/g)].map(m => m[1].trimEnd())

export type InstructionResult = { error: string } | { document: string; skipped: string[] }

const indent = (lines: string[]) => lines.map(l => `  ${l}`)
const section = (title: string, lines: string[]) => lines.length ? `${title}\n\n${lines.join('\n')}` : title
const heading = (level: string, b: Block) => `${level} ${blockLabel(b)} "${b.name}"${b.file ? ` (${b.file})` : ''} #${b.id}`

export function instructionDocument(p: Project): InstructionResult {
  const ws = warnings(p)
  const stop = ws.find(w => w.kind === 'stop')
  if (stop) return { error: stop.todo }
  const skipped = [...new Map(ws.filter(w => w.kind === 'skip').map(w => [w.key, w])).values()]
    .map(w => `Skipped: ${w.text[0].toLowerCase()}${w.text.slice(1)}`)

  const top = topBlock(p)!
  const pages = pagesOf(p, top)
  const pageIds = new Set(pages.map(b => b.id))
  const labels = new Set<string>([blockLabel(top)])
  if (top.type === 'checkpoint') labels.add(BUILT_PAGE.label)
  const usedAssets = new Set<string>()
  const usedDefs = new Set<string>()

  function value(t: Trait, popups: string[]): string | null {
    const kind = TRAIT_TYPES[t.type].valueKind
    if (t.bobPicks || (!t.value.trim() && kind !== 'asset' && kind !== 'action')) return 'you choose'
    switch (kind) {
      case 'color': {
        const preset = COLOR_PRESETS.find(c => c.hex.toLowerCase() === t.value.toLowerCase())
        return preset ? `${preset.name} (${preset.hex})` : t.value
      }
      case 'asset': {
        const a = p.assets.find(a => a.id === t.value)
        if (!a) return null
        usedAssets.add(a.id)
        return `assets/${a.file}`
      }
      case 'action': {
        const a = parseAction(t.value)
        const to = a.kind === 'action' ? undefined : p.blocks[a.id]
        if (a.kind === 'page') return pageIds.has(a.id) ? `go to "${to!.name}" page (${to!.file}) #${a.id}` : 'go to missing page'
        if (a.kind === 'popup') return popups.includes(a.id) ? `open "${to!.name}" popup #${a.id}` : null
        return t.value || null
      }
      case 'text': return `"${t.value.trim()}"`
      case 'choice': return t.value
    }
  }

  function traitLines(id: string, popups: string[]): string[] {
    const t = p.traits[id]
    if (!t) return []
    const note = t.note.trim() ? [`  - Note: "${t.note.trim()}"`] : []
    if (t.type === 'tellbob') return t.value.trim() ? [`- The user says: "${t.value.trim()}"`, ...note] : []
    if (t.type === 'letbobpick') return [`- You choose: ${t.value.trim() || 'anything in this Block'}`, ...note]
    const v = value(t, popups)
    const type = TRAIT_TYPES[t.type]
    return v === null ? [] : [`- ${type.label} (${type.meaning}): ${v}`, ...note]
  }

  const noteLine = (b: Block) => b.note.trim() ? [`- Note: "${b.note.trim()}"`] : []

  function inside(b: Block, popups: string[], ids: boolean): string[] {
    return [
      ...noteLine(b),
      ...b.traits.flatMap(t => traitLines(t, popups)),
      ...b.children.flatMap(c => p.blocks[c] ? blockLines(p.blocks[c], popups, ids) : []),
    ]
  }

  function blockLines(b: Block, popups: string[], ids: boolean): string[] {
    labels.add(blockLabel(b))
    const def = b.inst ? p.defs[b.inst] : undefined
    if (def) usedDefs.add(b.inst!)
    return [
      `- ${blockLabel(b)} "${b.name}"${def ? ` (Instance of "${p.blocks[def.blockId]?.name}")` : ''}${ids ? ` #${b.id}` : ''}`,
      ...indent(inside(b, popups, ids)),
    ]
  }

  const body: string[] = []
  if (top.type === 'checkpoint')
    body.push(section('## Already built', pages.filter(b => b.locked).map(b => heading('-', b))))
  body.push(section(heading('##', top), [...noteLine(top), ...top.traits.flatMap(t => traitLines(t, []))]))
  for (const page of pages) {
    if (page.locked && !page.traits.length && !page.children.length && !page.note.trim()) continue
    labels.add(blockLabel(page))
    body.push(section(heading('###', page), inside(page, popupsIn(p, page), true)))
  }
  if (usedDefs.size) {
    const allPopups = pages.flatMap(b => popupsIn(p, b))
    body.push(section('## Custom Blocks', [...usedDefs].flatMap(d => p.blocks[p.defs[d].blockId] ? blockLines(p.blocks[p.defs[d].blockId], allPopups, false) : [])))
  }
  if (p.assets.length) {
    body.push(section('## Library', p.assets.map(a => `- assets/${a.file}: ${a.kind}`
      + (a.width && a.height ? `, ${a.width}×${a.height} px` : '')
      + (a.seconds ? `, ${Math.round(a.seconds)} s` : '')
      + (usedAssets.has(a.id) ? ', used by a Trait' : ''))))
  }

  const types = Object.entries(BLOCK_TYPES).flatMap(([type, d]) =>
    type === 'checkpoint' ? [d, BUILT_PAGE] : [d])
  const glossary = section('## Block types used', types.filter(d => labels.has(d.label)).map(d => `- ${d.label}: ${d.meaning}`))

  const header = HEADER + (top.type === 'checkpoint' ? `\n${EXTRA_LINE}` : '')
  return { document: [header, glossary, ...body].join('\n\n') + '\n', skipped }
}
