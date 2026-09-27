import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ICONS } from '../icons.ts'
import { COLOR_PRESETS, TRAIT_TYPES } from '../model/catalogue.ts'
import type { Project, Trait } from '../model/types.ts'
import { hasOverride } from '../model/project.ts'
import { updateProject } from '../store.ts'
import { cx } from './cx.ts'
import { dragSource, useDrag } from './drag.ts'
import { onClickOptions } from './tree.ts'
import type { Option } from './tree.ts'
import { openMenu, TraitNote } from './Overlays.tsx'
import { Mark } from './Warnings.tsx'
import { bobPicksControl, setBobPicks } from './bobPicks.ts'
import { whiteTextOn } from './contrast.ts'
import styles from './parts.module.css'

const BOB_PICKS = '\u0000bob'
const CUSTOM = '\u0000custom'
const MISSING = 'What this pointed to was deleted. Pick another one.'

export function TextField({ value, onChange, placeholder, autoFocus, className }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <input
      className={cx(styles.text, className)}
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      size={Math.min(34, Math.max(3, (value || placeholder || '').length + 1))}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}

function LongText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [big, setBig] = useState(false)
  if (big) return (
    <>
      <textarea className={styles.big} value={value} placeholder={placeholder} autoFocus onChange={e => onChange(e.target.value)} />
      <button className={styles.small} title="Make it smaller" onClick={() => setBig(false)}>⤡</button>
    </>
  )
  return (
    <>
      <TextField value={value} placeholder={placeholder} onChange={onChange} />
      {value.length > 30 && <button className={styles.small} title="Show all of it" onClick={() => setBig(true)}>⤢</button>}
    </>
  )
}

// Under the button (top), or ending just above it (above) when there's no room below.
type At = { left: number; top: number; above: number }

function under(el: Element): At {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.bottom + 4, above: r.top - 4 }
}

// The context menu look, shared by the dropdown lists and the color menu.
function Popover({ at, title, onClose, children }: { at: At; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    // Keep it inside the window; offsetWidth ignores the pop-in scale.
    const el = ref.current!
    const h = el.offsetHeight
    const top = at.top + h <= innerHeight - 8 ? at.top : at.above - h
    el.style.left = `${Math.max(8, Math.min(at.left, innerWidth - el.offsetWidth - 8))}px`
    el.style.top = `${Math.max(8, Math.min(top, innerHeight - h - 8))}px`
  }, [at])
  useEffect(() => {
    const outside = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
    // It is placed once, so close it when the Canvas scrolls or zooms under it.
    document.addEventListener('wheel', outside, { passive: true })
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', key)
      document.removeEventListener('wheel', outside)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])
  // React bubbles through the portal: stop the pill's drag and its context menu.
  return createPortal(
    <div ref={ref} className={styles.menu} onPointerDown={e => e.stopPropagation()} onContextMenu={e => e.stopPropagation()}>
      <div className={styles.menuTitle}>{title}</div>
      {children}
    </div>,
    document.body,
  )
}

function ListMenu({ at, title, value, options, onPick, onClose }: {
  at: At
  title: string
  value: string
  options: Option[]
  onPick: (v: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus() }, [])

  function onKeyDown(e: React.KeyboardEvent) {
    // Keep Ctrl+Z and friends from undoing under the open list, as the native select did.
    if (e.ctrlKey || e.metaKey) e.stopPropagation()
    const items = [...ref.current!.querySelectorAll<HTMLElement>('[role="option"]')]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const moves: Record<string, number> = { ArrowDown: Math.min(i + 1, items.length - 1), ArrowUp: Math.max(i - 1, 0), Home: 0, End: items.length - 1 }
    if (e.key in moves) {
      e.preventDefault()
      items[moves[e.key]].focus()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      onClose()
    }
  }

  const item = (o: Option) => (
    <button
      key={o.value}
      role="option"
      aria-selected={o.value === value}
      className={cx(styles.item, o.missing && styles.warn)}
      title={o.missing && MISSING}
      style={o.font ? { fontFamily: o.font } : undefined}
      // Focus follows the pointer, so only one row is ever lit.
      onPointerEnter={e => e.currentTarget.focus({ preventScroll: true })}
      onClick={() => onPick(o.value)}
    >
      {o.label}
      {o.value === value && <ICONS.check weight="bold" size={14} />}
    </button>
  )

  return (
    <Popover at={at} title={title} onClose={onClose}>
      <div ref={ref} role="listbox" aria-label={title} onKeyDown={onKeyDown}>
        <div className={styles.options}>{options.map(item)}</div>
        <div className={styles.split} aria-hidden />
        {item({ value: BOB_PICKS, label: '💡 Bob picks' })}
        {item({ value: CUSTOM, label: 'custom…' })}
      </div>
    </Popover>
  )
}

function Dropdown({ value, options, onChange, onBobPicks, title }: {
  value: string
  options: Option[]
  onChange: (v: string) => void
  onBobPicks?: () => void
  title: string
}) {
  const [typing, setTyping] = useState(false)
  const [at, setAt] = useState<At | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const current = options.find(o => o.value === value)
  const custom = typing || !current

  const open = () => setAt(under(btn.current!))
  function close() {
    setAt(null)
    btn.current?.focus({ preventScroll: true })
  }

  // The value stays as typed until the user picks something from the list.
  const menu = at && (
    <ListMenu at={at} title={title} value={custom ? CUSTOM : value} options={options} onClose={close} onPick={v => {
      close()
      if (v === CUSTOM) {
        if (!custom) onChange('')
        setTyping(true)
      } else if (v === BOB_PICKS) {
        onBobPicks?.()
      } else {
        setTyping(false)
        onChange(v)
      }
    }} />
  )

  if (custom) return (
    <>
      <TextField value={value} placeholder="type your own" autoFocus={typing} onChange={onChange} />
      <button
        ref={btn}
        className={styles.small}
        title="Pick from the list"
        aria-haspopup="listbox"
        aria-expanded={!!at}
        onPointerDown={e => { if (at) e.nativeEvent.stopImmediatePropagation() }}
        onClick={() => { if (at) setAt(null); else open() }}
      >▾</button>
      {menu}
    </>
  )

  return (
    <>
      <button
        ref={btn}
        className={cx(styles.select, current.missing && styles.warn)}
        title={current.missing && MISSING}
        aria-label={`${title}: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={!!at}
        // While open, keep the menu's outside listener from closing it before this click toggles it.
        onPointerDown={e => { if (at) e.nativeEvent.stopImmediatePropagation() }}
        onClick={() => { if (at) setAt(null); else open() }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            open()
          }
        }}
      >
        {current.label}
      </button>
      {menu}
    </>
  )
}

function ColorMenu({ at, value, onDrag, onChange, onBobPicks, onClose }: {
  at: At
  value: string
  onDrag: (v: string) => void
  onChange: (v: string) => void
  onBobPicks: () => void
  onClose: () => void
}) {
  // React's onChange fires on every step of a drag; the native change event fires once, on release.
  const picker = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = picker.current!
    const done = () => onChange(el.value.toUpperCase())
    el.addEventListener('change', done)
    return () => el.removeEventListener('change', done)
  }, [onChange])
  return (
    <Popover at={at} title="Colors" onClose={onClose}>
      <div className={styles.swatches}>
        {COLOR_PRESETS.map(c => (
          <button
            key={c.hex}
            title={c.name}
            className={cx(styles.preset, c.hex === value.toUpperCase() && styles.on)}
            style={{ background: c.hex }}
            onClick={() => { onChange(c.hex); onClose() }}
          />
        ))}
      </div>
      <div className={styles.anyColor}>
        Any color
        <input
          ref={picker}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : '#000000'}
          onChange={e => onDrag(e.target.value.toUpperCase())}
        />
        <span className={styles.hex}>{value.toUpperCase()}</span>
      </div>
      <div className={styles.split} aria-hidden />
      <button className={styles.item} onClick={() => { onClose(); onBobPicks() }}>💡 Bob picks</button>
    </Popover>
  )
}

// The chip is the chosen color itself, so its name or hex sits on it.
function ColorField({ value: saved, onChange, onBobPicks, title }: { value: string; onChange: (v: string) => void; onBobPicks: () => void; title: string }) {
  const [at, setAt] = useState<At | null>(null)
  // While the picker is dragged only this chip repaints; the Project changes once, on release.
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? saved
  const commit = (v: string) => { setDraft(null); onChange(v) }
  const close = () => { if (draft) commit(draft); setAt(null) }
  const name = COLOR_PRESETS.find(c => c.hex === value.toUpperCase())?.name
  return (
    <>
      <button
        className={cx(styles.color, whiteTextOn(value) && styles.onDark)}
        style={{ background: value }}
        aria-label={`${title}: ${name ?? value.toUpperCase()}`}
        aria-expanded={!!at}
        // While open, keep the menu's outside listener from closing it before this click toggles it.
        onPointerDown={e => { if (at) e.nativeEvent.stopImmediatePropagation() }}
        onClick={e => at ? close() : setAt(under(e.currentTarget))}
      >
        {name ?? <span className={styles.hex}>{value.toUpperCase()}</span>}
      </button>
      {at && <ColorMenu at={at} value={value} onDrag={setDraft} onChange={commit} onBobPicks={onBobPicks} onClose={close} />}
    </>
  )
}

function ValueField({ p, t, onBobPicks }: { p: Project; t: Trait; onBobPicks: () => void }) {
  const type = TRAIT_TYPES[t.type]
  const set = (v: string) => updateProject(d => { d.traits[t.id].value = v })
  const title = type.label[0].toUpperCase() + type.label.slice(1)
  switch (type.valueKind) {
    case 'text':
      return <LongText value={t.value} placeholder={type.hint} onChange={set} />
    case 'color':
      return <ColorField value={t.value} onChange={set} title={title} onBobPicks={onBobPicks} />
    case 'choice':
      return <Dropdown value={t.value} onChange={set} title={title} onBobPicks={onBobPicks}
        options={type.choices!.map(c => ({ value: c, label: c, font: t.type === 'font' ? c : undefined }))} />
    case 'action':
      return <Dropdown value={t.value} onChange={set} title={title} onBobPicks={onBobPicks} options={onClickOptions(p, t.id)} />
    case 'asset': {
      const options: Option[] = [
        { value: '', label: 'pick from Library' },
        ...p.assets.filter(a => a.kind === t.type).map(a => ({ value: a.id, label: a.file })),
      ]
      if (/^a\d+$/.test(t.value) && !options.some(o => o.value === t.value)) options.push({ value: t.value, label: 'missing file', missing: true })
      return <Dropdown value={t.value} onChange={set} title={title} onBobPicks={onBobPicks} options={options} />
    }
  }
}

export default function TraitPill({ p, id, inInst = false }: { p: Project; id: string; inInst?: boolean }) {
  const drag = useDrag()
  const hintRef = useRef<HTMLInputElement>(null)
  const t = p.traits[id]
  if (!t) return null
  const type = TRAIT_TYPES[t.type]
  const Icon = ICONS[type.icon]
  const control = bobPicksControl(t.type, t.value)

  function handToBob() {
    updateProject(p => { setBobPicks(p, id, true) }, null)
    // focus the hint field after React re-renders
    requestAnimationFrame(() => hintRef.current?.focus({ preventScroll: true }))
  }

  const hintLen = t.note.length
  const hintSize = Math.min(30, Math.max(14, hintLen + 1))

  return (
    <span
      className={cx(
        styles.pill,
        `cat-${type.category}`,
        drag?.item.kind === 'trait' && drag.item.id === id && styles.lifted,
        p.blocks.canvas.traits.includes(id) && styles.loose,
      )}
      data-tid={id}
      data-tip={`t:${id}`}
      onPointerDown={dragSource({ kind: 'trait', id })}
      onContextMenu={e => openMenu(e, id)}
    >
      <Icon weight="fill" size={16} />
      {type.label}
      {t.bobPicks ? (
        <span className={cx(styles.bobChip, 'cat-bob')}>
          <ICONS.t_bobpicks weight="fill" size={14} />
          Bob picks
          <button
            className={styles.bobChipX}
            title="Pick it myself"
            onClick={() => updateProject(p => { setBobPicks(p, id, false) }, null)}
          >×</button>
        </span>
      ) : (
        <ValueField p={p} t={t} onBobPicks={handToBob} />
      )}
      {t.bobPicks && (
        <input
          ref={hintRef}
          className={styles.bobHint}
          placeholder="hint, like something warm"
          value={t.note}
          size={hintSize}
          onChange={e => updateProject(p => { p.traits[id].note = e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        />
      )}
      {!t.bobPicks && control === 'bulb' && (
        <button
          className={cx(styles.bulb, 'cat-bob')}
          title="Let Bob pick this value"
          onClick={handToBob}
        >
          <ICONS.t_bobpicks weight="fill" size={14} />
        </button>
      )}
      {(t.note || t.noteOn) && !t.bobPicks && <TraitNote id={id} note={t.note} noteOn={t.noteOn} />}
      {inInst && t.from && hasOverride(t) && <span className={styles.marker} title="✎ changed here">✎</span>}
      {inInst && !t.from && <span className={styles.marker} title="+ only here">+</span>}
      <Mark id={id} />
    </span>
  )
}
