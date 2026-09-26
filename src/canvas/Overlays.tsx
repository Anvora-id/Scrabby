import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ICONS } from '../icons.ts'
import type { Project } from '../model/types.ts'
import { updateProject } from '../store.ts'
import { setEditing } from '../store.ts'
import { getDrag, peekPending } from './drag.ts'
import { menuItems } from './menu.ts'
import type { MenuItem } from './menu.ts'
import { tipFor } from './tooltip.ts'
import { cx } from './cx.ts'
import styles from './Overlays.module.css'
import parts from './parts.module.css'

// ── Menu state ────────────────────────────────────────────────────────────────

interface MenuState {
  id: string
  x: number
  y: number
  items?: MenuItem[]
}

let menuState: MenuState | null = null
const menuListeners = new Set<() => void>()

function setMenuState(s: MenuState | null) {
  menuState = s
  menuListeners.forEach(l => l())
}

// `items` replaces the id's own items (the empty Canvas has its own menu).
export function openMenu(e: React.MouseEvent, id: string, items?: MenuItem[]): void {
  const target = e.target as Element
  if (target.closest('input, textarea')) return
  e.preventDefault()
  e.stopPropagation()
  setMenuState({ id, x: e.clientX, y: e.clientY, items })
}

export function isMenuOpen(): boolean {
  return menuState !== null
}

function useMenuState(): MenuState | null {
  const [, tick] = useState(0)
  useEffect(() => {
    const cb = () => tick(n => n + 1)
    menuListeners.add(cb)
    return () => { menuListeners.delete(cb) }
  }, [])
  return menuState
}

// ── ContextMenu ───────────────────────────────────────────────────────────────

export function ContextMenu({ p }: { p: Project }) {
  const state = useMenuState()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) return
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setMenuState(null)
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuState(null) }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [state])

  if (!state) return null
  const { id, x, y } = state
  if (!state.items && !p.blocks[id] && !p.traits[id]) return null

  const items = state.items ?? menuItems(p, id)
  const left = Math.min(x, innerWidth - 210)
  const top = Math.min(y, innerHeight - 8 - 32 * items.length)

  return createPortal(
    <div ref={ref} className={styles.ctxMenu} style={{ left, top }} role="menu">
      {items.map(item => (
        <button
          key={item.label}
          role="menuitem"
          className={styles.ctxItem}
          onClick={() => {
            setMenuState(null)
            if (item.change) updateProject(item.change, null)
            else if (item.act) item.act()
            else if (item.edit) setEditing(item.edit)
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TipState {
  key: string
  rect: DOMRect
}

export function Tooltip({ p }: { p: Project }) {
  const [tip, setTip] = useState<TipState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<TipState | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const busy = () => !!getDrag() || !!peekPending() || isMenuOpen()

  useEffect(() => {
    const clear = () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
      pending.current = null
      setTip(null)
    }

    const onOver = (e: PointerEvent) => {
      if (busy()) return
      const el = (e.target as Element).closest<HTMLElement>('[data-tip]')
      const key = el?.dataset.tip ?? ''
      const currentKey = pending.current?.key ?? tip?.key ?? ''
      if (key === currentKey) return
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
      setTip(null)
      pending.current = null
      if (!key) return
      const rect = el!.getBoundingClientRect()
      pending.current = { key, rect }
      timer.current = setTimeout(() => {
        if (!busy()) setTip(pending.current)
        pending.current = null
        timer.current = null
      }, 500)
    }

    const hide = () => clear()

    window.addEventListener('pointerover', onOver)
    // Capture: a handler that stops the event must not keep the tooltip up.
    const hides = ['pointerdown', 'contextmenu', 'wheel', 'keydown'] as const
    hides.forEach(t => window.addEventListener(t, hide, true))

    return () => {
      window.removeEventListener('pointerover', onOver)
      hides.forEach(t => window.removeEventListener(t, hide, true))
    }
  }, [tip])

  // Place it from its real size: 8px below the item (else above), 8px inside the window on every side.
  useLayoutEffect(() => {
    const el = box.current
    if (!el || !tip) return
    const r = tip.rect
    const w = el.offsetWidth
    const h = el.offsetHeight
    const top = r.bottom + 8 + h <= innerHeight - 8 ? r.bottom + 8 : r.top - 8 - h
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - 8 - w)) + 'px'
    el.style.top = Math.max(8, Math.min(top, innerHeight - 8 - h)) + 'px'
  }, [tip])

  if (!tip) return null
  const data = tipFor(p, tip.key)
  if (!data) return null

  const Icon = ICONS[data.icon]

  return createPortal(
    <div
      ref={box}
      className={cx(styles.tip, data.cat ? `cat-${data.cat}` : styles.tipMuted)}
      role="tooltip"
    >
      <div className={styles.tipTitle}>
        <Icon weight="fill" size={16} />
        {data.title}
      </div>
      <div className={styles.tipText}>{data.text}</div>
      {data.loose && <div className={styles.tipLoose}>{data.loose}</div>}
    </div>,
    document.body,
  )
}

// ── BlockNote ─────────────────────────────────────────────────────────────────

export function BlockNote({ id, note, noteOn }: { id: string; note: string; noteOn?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (noteOn && !note) ref.current?.focus({ preventScroll: true })
  }, [noteOn, note])

  return (
    <div className={styles.sticky}>
      <button
        className={styles.stickyClose}
        title="Delete Note"
        onClick={() => updateProject(p => { p.blocks[id].note = ''; p.blocks[id].noteOn = false }, null)}
      >×</button>
      <textarea
        ref={ref}
        className={styles.stickyArea}
        placeholder="Note for Bob"
        value={note}
        onChange={e => updateProject(p => { p.blocks[id].note = e.target.value })}
      />
    </div>
  )
}

// ── TraitNote ─────────────────────────────────────────────────────────────────

export function TraitNote({ id, note, noteOn }: { id: string; note: string; noteOn?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [big, setBig] = useState(false)

  useEffect(() => {
    if (noteOn && !note) ref.current?.focus({ preventScroll: true })
  }, [noteOn, note])

  const set = (v: string) => updateProject(p => { p.traits[id].note = v })
  const len = note.length

  if (big) return (
    <span className={styles.traitNoteWrap}>
      <textarea
        className={cx(parts.big, styles.traitNoteBig)}
        placeholder="note for Bob"
        value={note}
        autoFocus
        onChange={e => set(e.target.value)}
      />
      <button className={parts.small} title="Make it smaller" onClick={() => setBig(false)}>⤡</button>
    </span>
  )

  return (
    <span className={styles.traitNoteWrap}>
      <input
        ref={ref}
        className={styles.traitNoteInput}
        placeholder="note for Bob"
        value={note}
        size={Math.min(30, Math.max(8, len + 1))}
        onChange={e => set(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
      />
      {note.length > 30 && <button className={parts.small} title="Show all of it" onClick={() => setBig(true)}>⤢</button>}
    </span>
  )
}
