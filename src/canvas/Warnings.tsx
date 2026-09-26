import { createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ICONS } from '../icons.ts'
import type { Warning } from '../instructions/warnings.ts'
import type { Project } from '../model/types.ts'
import { badgeOf } from './marks.ts'
import styles from './Warnings.module.css'

export const MarksContext = createContext<{ marks: Map<string, Warning[]>; busy: string | null; open: (id: string) => void }>({
  marks: new Map(), busy: null, open: () => {},
})

export function Mark({ id }: { id: string }) {
  const { marks, busy, open } = useContext(MarksContext)
  const ws = marks.get(id)
  if (!ws || busy === id) return null
  return (
    <button className={styles.badge} data-badge={id} title={ws.map(w => w.text).join('\n')} onClick={() => open(id)}>
      {badgeOf(ws)}
    </button>
  )
}

export function Popover({ p, id, ws, x, y, onShow, onClose }: {
  p: Project; id: string; ws: Warning[]; x: number; y: number
  onShow: (id: string) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current!
    el.style.top = `${Math.max(8, Math.min(y, innerHeight - el.offsetHeight - 8))}px`
  })

  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Element
      if (!ref.current?.contains(t) && !t.closest?.('[data-badge]')) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])

  function pickOne() {
    onClose()
    document.querySelector(`[data-tid="${id}"]`)?.querySelector<HTMLElement>('select, input, textarea')?.focus()
  }

  return createPortal(
    <div ref={ref} data-wpop className={styles.popover} style={{ left: Math.max(8, Math.min(x, innerWidth - 308)), top: y }}>
      {ws.map((w, i) => (
        <div key={i} className={styles.item}>
          <span className={styles.char}>{badgeOf([w])}</span>
          <div className={styles.words}>
            {w.where && <button className={styles.where} title="Show it on the Canvas" onClick={() => { onShow(id); onClose() }}>{w.where}</button>}
            <div className={styles.text}>{w.text}</div>
            <div className={styles.todo}>{w.todo}</div>
            {w.def && <div className={styles.todo}>Comes from the Custom Block "{p.blocks[p.defs[w.def]?.blockId]?.name}"</div>}
          </div>
        </div>
      ))}
      <div className={styles.buttons}>
        <button className={styles.ghost} onClick={() => { onShow(id); onClose() }}>Show</button>
        {p.traits[id] && <button className={styles.ghost} onClick={pickOne}>Pick one</button>}
        <button className={styles.ghost} onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body,
  )
}

export function Stepper({ count, clean, onGo }: { count: number; clean: boolean; onGo: (d: 1 | -1) => void }) {
  if (clean) return <div className={styles.ok}><ICONS.check weight="bold" size={16} className={styles.check} />Nothing to check</div>
  if (!count) return null
  return (
    <div className={styles.stepper}>
      <button className={styles.step} title="Previous" onClick={() => onGo(-1)}>‹</button>
      <span className={styles.count}>⚠ {count} to check</span>
      <button className={styles.step} title="Next" onClick={() => onGo(1)}>›</button>
    </div>
  )
}

export function flash(el: HTMLElement): void {
  const c = getComputedStyle(el).getPropertyValue('--flash').trim()
  el.animate([
    { boxShadow: `0 0 0 6px ${c}` },
    { boxShadow: `0 0 0 6px ${c}`, offset: 0.4 },
    { boxShadow: `0 0 0 0 ${c}` },
  ], 1400)
}
