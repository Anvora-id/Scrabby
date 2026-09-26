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

export function useDrag(listener: () => void): () => void {
  _dragListeners.add(listener)
  return () => _dragListeners.delete(listener)
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

export function dragSource(item: DragItem): (e: PointerEvent) => void {
  return (e: PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as Element | null
    if (target?.closest('input, select, textarea, button')) return
    e.stopPropagation()
    _pending = { el: e.currentTarget as HTMLElement, item, x: e.clientX, y: e.clientY }
  }
}
