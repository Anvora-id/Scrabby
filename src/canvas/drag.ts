import { useSyncExternalStore } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { isTraitItem } from './tree.ts'
import type { DragItem, Drop } from './tree.ts'

// ── DragState ─────────────────────────────────────────────────────────────────

export interface DragState {
  item: DragItem
  w: number
  h: number
  pill: boolean
  target: Drop | null
  trash: boolean
}

let _drag: DragState | null = null
const _dragListeners: Set<() => void> = new Set()

export function getDrag(): DragState | null {
  return _drag
}

export function setDrag(state: DragState | null): void {
  _drag = state
  for (const fn of _dragListeners) fn()
}

export function useDrag(): DragState | null {
  return useSyncExternalStore(
    cb => { _dragListeners.add(cb); return () => _dragListeners.delete(cb) },
    getDrag,
  )
}

// ── Pending press ─────────────────────────────────────────────────────────────

export interface Pending {
  el: HTMLElement
  item: DragItem
  x: number
  y: number
}

let _pending: Pending | null = null

export function takePending(): Pending | null {
  const p = _pending
  _pending = null
  return p
}

export function peekPending(): Pending | null {
  return _pending
}

// ── dragSource ────────────────────────────────────────────────────────────────

export function dragSource(item: DragItem): (e: ReactPointerEvent<HTMLElement>) => void {
  return e => {
    if (e.button !== 0) return
    const target = e.target as Element | null
    if (target?.closest('input, select, textarea, button')) return
    e.stopPropagation()
    _pending = { el: e.currentTarget, item, x: e.clientX, y: e.clientY }
  }
}

// ── Aim ───────────────────────────────────────────────────────────────────────

// Where the dragged item would go: a drop spot, the palette's delete, or neither.
export interface Aim {
  target: Drop | null
  trash: boolean
}

export const sameAim = (a: Aim, b: Aim) => JSON.stringify(a) === JSON.stringify(b)

// What a pointer move does to the drop spot: keep it, take the new one now, or wait until the pointer rests on it.
export function aimStep(item: DragItem, cur: Aim, now: Aim, held: () => boolean): 'keep' | 'now' | 'wait' {
  if (sameAim(cur, now)) return 'keep'
  // A chosen spot holds until the pointer is clearly past it, so it doesn't flicker between neighbours.
  if ((cur.target || cur.trash) && held()) return 'keep'
  // A Trait opens no gap, so nothing moves; the palette's delete colour follows the pointer at once.
  if (isTraitItem(item) || now.trash || cur.trash) return 'now'
  return 'wait'
}
