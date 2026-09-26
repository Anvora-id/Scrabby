import type { Project } from '../model/types.ts'
import { canDrop, isTraitItem, leafList, parentMap, repairLayout } from './tree.ts'
import type { DragItem, Drop, Slot } from './tree.ts'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Rect = { left: number; top: number; right: number; bottom: number }
export type DragRects = { blocks: Map<string, Rect>; traits: Map<string, Rect> }

// ── targetAt ──────────────────────────────────────────────────────────────────

export function targetAt(
  p: Project,
  rects: DragRects,
  item: DragItem,
  x: number,
  y: number,
): Drop | null {
  const parents = parentMap(p)

  // 1. hit = the Block with the most ancestors whose rect contains the point
  let hit: string | null = null
  let hitDepth = -1
  for (const [bxId, rect] of rects.blocks) {
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      let depth = 0
      let cur: string | undefined = parents.get(bxId)
      while (cur) { depth++; cur = parents.get(cur) }
      if (depth > hitDepth) { hit = bxId; hitDepth = depth }
    }
  }

  if (hit === null) return null

  function targetFor(bxId: string): Drop | null {
    const bxRect = rects.blocks.get(bxId)
    if (!bxRect) return null
    const width = bxRect.right - bxRect.left
    const height = bxRect.bottom - bxRect.top

    const parentId = parents.get(bxId)

    // check edge drops into parent
    if (parentId && parentId !== 'canvas' && !isTraitItem(item)) {
      if (canDrop(p, item, parentId, parents)) {
        const ex = Math.min(28, width / 5)
        const ey = Math.min(12, height / 5)
        let where: Slot['where'] | undefined
        if (x - bxRect.left < ex) where = 'left'
        else if (bxRect.right - x < ex) where = 'right'
        else if (y - bxRect.top < ey) where = 'above'
        else if (bxRect.bottom - y < ey) where = 'below'
        if (where) return { id: parentId, slot: { where, ref: bxId } }
      }
    }

    if (!canDrop(p, item, bxId, parents)) return null

    if (isTraitItem(item)) {
      // index among measured pills: the dragged pill is not measured, so this is its index after detach
      const pills = (p.blocks[bxId]?.traits ?? []).flatMap(tid => rects.traits.get(tid) ?? [])
      const tIdx = pills.findIndex(r => y < r.top || (y <= r.bottom && x < (r.left + r.right) / 2))
      return { id: bxId, tIdx: tIdx === -1 ? pills.length : tIdx }
    }

    // Block item → slot from nearestSlot
    return { id: bxId, slot: nearestSlot(p, rects, bxId, x, y) }
  }

  // 4. Walk from hit up while not canvas; first non-null targetFor wins
  let cur: string | null = hit
  while (cur && cur !== 'canvas') {
    const result = targetFor(cur)
    if (result !== null) return result
    cur = parents.get(cur) ?? null
  }
  return null
}

function nearestSlot(
  p: Project,
  rects: DragRects,
  bxId: string,
  x: number,
  y: number,
): Slot | null {
  const bx = p.blocks[bxId]
  if (!bx) return null
  const layout = repairLayout(bx)

  // rows = each root item of repairLayout(bx) as its measured ids plus their union rect
  type Row = { ids: string[]; union: Rect }
  const rows: Row[] = []
  for (const rootItem of layout.k) {
    const ids = leafList(rootItem)
    const measured = ids.filter(id => rects.blocks.has(id))
    if (measured.length === 0) continue
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
    for (const id of measured) {
      const r = rects.blocks.get(id)!
      if (r.left < left) left = r.left
      if (r.top < top) top = r.top
      if (r.right > right) right = r.right
      if (r.bottom > bottom) bottom = r.bottom
    }
    rows.push({ ids: measured, union: { left, top, right, bottom } })
  }

  if (rows.length === 0) return null

  // find the row spanning y (inclusive)
  let targetRow: Row | undefined
  for (const row of rows) {
    if (y >= row.union.top && y <= row.union.bottom) { targetRow = row; break }
  }
  // if none, the first row whose top is below y → rowBefore
  if (!targetRow) {
    for (const row of rows) {
      if (row.union.top > y) return { where: 'rowBefore', ref: row.ids[0] }
    }
    return null
  }

  // inside the row: for each id and each edge, compute distance; smallest wins
  let bestDist = Infinity
  let bestSlot: Slot | null = null

  const edges: { where: Slot['where']; dist: (r: Rect) => number }[] = [
    { where: 'left',  dist: r => distToSegment(x, y, r.left, r.top, r.left, r.bottom) },
    { where: 'right', dist: r => distToSegment(x, y, r.right, r.top, r.right, r.bottom) },
    { where: 'above', dist: r => distToSegment(x, y, r.left, r.top, r.right, r.top) },
    { where: 'below', dist: r => distToSegment(x, y, r.left, r.bottom, r.right, r.bottom) },
  ]

  for (const id of targetRow.ids) {
    const r = rects.blocks.get(id)
    if (!r) continue
    for (const edge of edges) {
      const d = edge.dist(r)
      if (d < bestDist) { bestDist = d; bestSlot = { where: edge.where, ref: id } }
    }
  }

  return bestSlot
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
