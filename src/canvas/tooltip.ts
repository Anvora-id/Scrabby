import { BLOCK_TYPES, BUILT_PAGE, LOOSE_IDEA_TOOLTIP, TRAIT_TYPES } from '../model/catalogue.ts'
import type { Category } from '../model/catalogue.ts'
import type { IconKey } from '../icons.ts'
import type { Project } from '../model/types.ts'
import { parentMap } from './tree.ts'

export interface Tip {
  icon: IconKey
  title: string
  text: string
  loose?: string
  cat: Category | null
}

export function tipFor(p: Project, key: string): Tip | null {
  // Determine if the Checkpoint Block is on the Canvas
  const checkpointOnCanvas = p.blocks['canvas'].children.some(id => {
    const b = p.blocks[id]
    return b && b.type === 'checkpoint'
  })
  const where = checkpointOnCanvas ? 'the Checkpoint' : 'the Site'
  const looseTooltip = LOOSE_IDEA_TOOLTIP.replace('{where}', where)

  function looseLine(id: string): string | undefined {
    // Walk up to the Block directly on the Canvas (or the item itself)
    const parents = parentMap(p)
    let cur: string | undefined = id
    let topBlock: string | undefined
    // For a trait id, start from its parent block
    if (p.traits[id]) {
      cur = parents.get(id)
    }
    while (cur && cur !== 'canvas') {
      const parent = parents.get(cur)
      if (parent === 'canvas') { topBlock = cur; break }
      cur = parent
    }
    if (!topBlock) {
      // id itself is directly on the canvas
      topBlock = p.traits[id] ? undefined : (p.blocks.canvas.children.includes(id) ? id : undefined)
      if (!topBlock && p.traits[id]) {
        // top-level trait
        if (p.blocks.canvas.traits.includes(id)) return looseTooltip
        return undefined
      }
    }
    if (!topBlock) return undefined
    const tb = p.blocks[topBlock]
    if (!tb) return undefined
    if (tb.type === 'site' || tb.type === 'checkpoint') return undefined
    return looseTooltip
  }

  if (key.startsWith('nb:')) {
    const type = key.slice(3) as keyof typeof BLOCK_TYPES
    const def = BLOCK_TYPES[type]
    if (!def) return null
    return { icon: def.icon, title: def.label, text: def.tooltip.replace('{where}', where), cat: def.category }
  }

  if (key.startsWith('nt:')) {
    const type = key.slice(3) as keyof typeof TRAIT_TYPES
    const def = TRAIT_TYPES[type]
    if (!def) return null
    return { icon: def.icon, title: def.label, text: def.tooltip, cat: def.category }
  }

  if (key.startsWith('b:')) {
    const id = key.slice(2)
    const b = p.blocks[id]
    if (!b) return null
    if (b.type === 'canvas') return null

    if (b.type === 'checkpoint') {
      return { icon: 'checkpoint', title: 'Checkpoint', text: BLOCK_TYPES.checkpoint.tooltip, cat: null }
    }
    if (b.locked) {
      return { icon: 'checkpoint', title: 'Built page', text: BUILT_PAGE.tooltip, cat: null }
    }
    if (b.inst) {
      const def = p.defs[b.inst]
      const defBlock = def ? p.blocks[def.blockId] : undefined
      const baseType = defBlock ? BLOCK_TYPES[defBlock.type as Exclude<typeof defBlock.type, 'canvas'>] : undefined
      const text = baseType ? baseType.tooltip.replace('{where}', where) : ''
      return {
        icon: 'custom',
        title: defBlock?.name ?? 'Custom Block',
        text,
        loose: looseLine(id),
        cat: 'my',
      }
    }
    // regular block
    const def = BLOCK_TYPES[b.type as Exclude<typeof b.type, 'canvas'>]
    const text = def.tooltip.replace('{where}', where)
    return { icon: def.icon, title: def.label, text, loose: looseLine(id), cat: def.category }
  }

  if (key.startsWith('t:')) {
    const id = key.slice(2)
    const t = p.traits[id]
    if (!t) return null
    const def = TRAIT_TYPES[t.type]
    return { icon: def.icon, title: def.label, text: def.tooltip, loose: looseLine(id), cat: def.category }
  }

  return null
}
