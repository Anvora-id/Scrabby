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

type At = { left: number; top: number }

// The context menu look, shared by the dropdown lists and the color menu.
function Popover({ at, title, onClose, children }: { at: At; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    // Keep it inside the window; offsetWidth ignores the pop-in scale.
    const el = ref.current!
    el.style.left = `${Math.max(8, Math.min(at.left, innerWidth - el.offsetWidth - 8))}px`
    el.style.top = `${Math.max(8, Math.min(at.top, innerHeight - el.offsetHeight - 8))}px`
  }, [at])
  useEffect(() => {
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])
  // React bubbles through the portal: stop the pill's drag.
  return createPortal(
    <div ref={ref} className={styles.menu} onPointerDown={e => e.stopPropagation()}>
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
      onClick={() => onPick(o.value)}
    >
      {o.label}
      {o.value === value && <ICONS.check weight="bold" size={14} />}
    </button>
  )

  return (
    <Popover at={at} title={title} onClose={onClose}>
      <div ref={ref} role="listbox" aria-label={title} onKeyDown={onKeyDown}>
        {options.map(item)}
        <div className={styles.split} aria-hidden />
        {item({ value: BOB_PICKS, label: '💡 Bob picks' })}
        {item({ value: CUSTOM, label: 'custom…' })}
      </div>
    </Popover>
  )
}

function Dropdown({ value, options, onChange, back, onBobPicks, title }: {
  value: string
  options: Option[]
  onChange: (v: string) => void
  back: string
  onBobPicks?: () => void
  title: string
}) {
  const [typing, setTyping] = useState(false)
  const [at, setAt] = useState<At | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const current = options.find(o => o.value === value)
  if (typing || !current) return (
    <>
      <TextField value={value} placeholder="type your own" autoFocus={typing} onChange={onChange} />
      <button className={styles.small} title="Pick from the list" onClick={() => { setTyping(false); onChange(back) }}>▾</button>
    </>
  )

  function open() {
    const r = btn.current!.getBoundingClientRect()
    setAt({ left: r.left, top: r.bottom + 4 })
  }
  function close() {
    setAt(null)
    btn.current?.focus({ preventScroll: true })
  }

  return (
    <>
      <button
        ref={btn}
        className={cx(styles.select, current.missing && styles.warn)}
        title={current.missing && MISSING}
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
      {at && (
        <ListMenu at={at} title={title} value={value} options={options} onClose={close} onPick={v => {
          close()
          if (v === CUSTOM) {
            setTyping(true)
            onChange('')
          } else if (v === BOB_PICKS) {
            onBobPicks?.()
          } else onChange(v)
        }} />
      )}
    </>
  )
}

function ColorMenu({ at, value, onChange, onClose }: { at: At; value: string; onChange: (v: string) => void; onClose: () => void }) {
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
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : '#000000'}
          onChange={e => onChange(e.target.value.toUpperCase())}
        />
        <span className={styles.hex}>{value.toUpperCase()}</span>
      </div>
    </Popover>
  )
}

// The chip is the chosen color itself, so its name or hex sits on it.
function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [at, setAt] = useState<At | null>(null)
  const name = COLOR_PRESETS.find(c => c.hex === value.toUpperCase())?.name
  return (
    <>
      <button
        className={cx(styles.color, whiteTextOn(value) && styles.onDark)}
        style={{ background: value }}
        // While open, keep the menu's outside listener from closing it before this click toggles it.
        onPointerDown={e => { if (at) e.nativeEvent.stopImmediatePropagation() }}
        onClick={e => {
          const r = e.currentTarget.getBoundingClientRect()
          setAt(at ? null : { left: r.left, top: r.bottom + 4 })
        }}
      >
        {name ?? <span className={styles.hex}>{value.toUpperCase()}</span>}
      </button>
      {at && <ColorMenu at={at} value={value} onChange={onChange} onClose={() => setAt(null)} />}
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
      return <ColorField value={t.value} onChange={set} />
    case 'choice':
      return <Dropdown value={t.value} onChange={set} title={title} back={type.default} onBobPicks={onBobPicks}
        options={type.choices!.map(c => ({ value: c, label: c, font: t.type === 'font' ? c : undefined }))} />
    case 'action':
      return <Dropdown value={t.value} onChange={set} title={title} back={type.default} onBobPicks={onBobPicks} options={onClickOptions(p, t.id)} />
    case 'asset': {
      const options: Option[] = [
        { value: '', label: 'pick from Library' },
        ...p.assets.filter(a => a.kind === t.type).map(a => ({ value: a.id, label: a.file })),
      ]
      if (/^a\d+$/.test(t.value) && !options.some(o => o.value === t.value)) options.push({ value: t.value, label: 'missing file', missing: true })
      return <Dropdown value={t.value} onChange={set} title={title} back="" onBobPicks={onBobPicks} options={options} />
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
