import { addBlock, addTrait, hasOverride, makeCustomBlock, unfollow } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import { canTrash, parentMap, removeItem, repairLayout } from './tree.ts'
import { insertInto, leafList } from './tree.ts'
import { mapLayout } from '../model/project.ts'

export interface MenuItem {
  label: string
  change?: (p: Project) => void
  act?: () => void
  edit?: string
}

export function deleteNote(p: Project, id: string): void {
  const b = p.blocks[id]
  if (b) { b.note = ''; b.noteOn = false }
  else if (p.traits[id]) { p.traits[id].note = ''; p.traits[id].noteOn = false }
}

// Copies every field (inst, from, removed, ov too) so an Instance's copy stays an Instance;
// `duplicate` unfollows the other copies.
export function copyOf(p: Project, id: string): string {
  const t = p.traits[id]
  if (t) {
    const nid = addTrait(p, t.type)
    p.traits[nid] = { ...structuredClone(t), id: nid }
    return nid
  }
  const src = p.blocks[id]
  const nid = addBlock(p, src.type as Exclude<typeof src.type, 'canvas'>, src.name)
  const file = p.blocks[nid].file // a Page copy gets its own file
  const ids: Record<string, string> = {}
  const children = src.children.map(cid => (ids[cid] = copyOf(p, cid)))
  const nb = { ...structuredClone(src), id: nid, traits: src.traits.map(tid => copyOf(p, tid)), children }
  if (file) nb.file = file
  if (src.layout) nb.layout = mapLayout(src.layout, x => ids[x] ?? x)
  p.blocks[nid] = nb
  return nid
}

export function duplicate(p: Project, id: string): void {
  const parents = parentMap(p)
  const parentId = parents.get(id)
  const isBlock = !!p.blocks[id]
  const newId = copyOf(p, id)

  if (isBlock) {
    const src = p.blocks[id]
    const newBlock = p.blocks[newId]
    // if not an Instance, unfollow the copy
    if (!src.inst) unfollow(p, newId)
    if (!parentId || parentId === 'canvas') {
      // loose Block: +30/+30
      if (src.pos) newBlock.pos = { x: src.pos.x + 30, y: src.pos.y + 30 }
      else newBlock.pos = { x: 30, y: 30 }
      p.blocks['canvas'].children.push(newId)
    } else {
      // drop into same parent, slot 'below' the original
      const parent = p.blocks[parentId]
      const layout = repairLayout(parent)
      parent.layout = insertInto(layout, newId, { where: 'below', ref: id })
      parent.children = leafList(parent.layout)
    }
    // a duplicate page gets its own file (already set by addBlock since it calls pageFile)
  } else {
    // Trait: drop at index + 1 in the same Block; a loose one also moves +30/+30
    const parent = p.blocks[parentId ?? 'canvas']
    parent.traits.splice(parent.traits.indexOf(id) + 1, 0, newId)
    const pos = p.traits[id].pos
    if (pos) p.traits[newId].pos = { x: pos.x + 30, y: pos.y + 30 }
  }
}

export function canMakeCustom(p: Project, id: string): boolean {
  const b = p.blocks[id]
  if (!b) return false
  if (b.type === 'site' || b.type === 'page' || b.type === 'checkpoint') return false
  if (b.locked) return false
  if (b.inst || b.defines) return false
  // must not hold an Instance or definition inside
  function hasCustom(bid: string): boolean {
    const bl = p.blocks[bid]
    if (!bl) return false
    if (bl.inst || bl.defines) return true
    return bl.children.some(hasCustom)
  }
  if (hasCustom(id)) return false
  // no ancestor is an Instance or definition
  const parents = parentMap(p)
  let cur = parents.get(id)
  while (cur && cur !== 'canvas') {
    const anc = p.blocks[cur]
    if (anc && (anc.inst || anc.defines)) return false
    cur = parents.get(cur)
  }
  return true
}

export function menuItems(p: Project, id: string): MenuItem[] {
  const items: MenuItem[] = []
  const b = p.blocks[id]
  const t = p.traits[id]
  const hasNote = b ? (!!b.note || !!b.noteOn) : (!!t?.note || !!t?.noteOn)

  if (!hasNote) {
    items.push({ label: 'Add Note', change: q => {
      const tb = q.blocks[id]; const tt = q.traits[id]
      if (tb) tb.noteOn = true; else if (tt) tt.noteOn = true
    }})
  } else {
    items.push({ label: 'Delete Note', change: q => deleteNote(q, id) })
  }

  if (b) {
    // Edit Custom Block (an Instance)
    if (b.inst) {
      items.push({ label: 'Edit Custom Block', edit: b.inst })
    }

    // Duplicate (when canTrash allows it)
    if (canTrash(p, { kind: 'block', id })) {
      items.push({ label: 'Duplicate', change: q => duplicate(q, id) })
    }

    // Bring back removed parts (N)
    if (b.inst && b.removed && b.removed.length > 0) {
      const n = b.removed.length
      items.push({ label: `Bring back removed parts (${n})`, change: q => { q.blocks[id].removed = [] } })
    }

    // Use the Custom Block's version
    if (b.from && hasOverride(b)) {
      items.push({ label: "Use the Custom Block's version", change: q => { delete q.blocks[id].ov } })
    }

    // Make Custom Block
    if (canMakeCustom(p, id)) {
      items.push({ label: 'Make Custom Block', change: q => makeCustomBlock(q, id) })
    }

    // Delete Block (when canTrash)
    if (canTrash(p, { kind: 'block', id })) {
      items.push({ label: 'Delete Block', change: q => removeItem(q, id) })
    }
  } else if (t) {
    // Trait: Duplicate
    items.push({ label: 'Duplicate', change: q => duplicate(q, id) })

    // Use the Custom Block's version (for copied Trait parts)
    if (t.from && hasOverride(t)) {
      items.push({ label: "Use the Custom Block's version", change: q => { delete q.traits[id].ov } })
    }

    // Delete Trait
    items.push({ label: 'Delete Trait', change: q => removeItem(q, id) })
  }

  return items
}
