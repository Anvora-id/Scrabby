import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ICONS } from '../icons.ts'
import { COLOR_PRESETS, TRAIT_TYPES } from '../model/catalogue.ts'
import type { Project, Trait } from '../model/types.ts'
import { updateProject } from '../store.ts'
import { cx } from './cx.ts'
import { dragSource, useDrag } from './drag.ts'
import { onClickOptions } from './tree.ts'
import type { Option } from './tree.ts'
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

function Dropdown({ value, options, onChange, back }: { value: string; options: Option[]; onChange: (v: string) => void; back: string }) {
  const [typing, setTyping] = useState(false)
  const current = options.find(o => o.value === value)
  if (typing || !current) return (
    <>
      <TextField value={value} placeholder="type your own" autoFocus={typing} onChange={onChange} />
      <button className={styles.small} title="Pick from the list" onClick={() => { setTyping(false); onChange(back) }}>▾</button>
    </>
  )
  return (
    <select
      className={cx(styles.select, current.missing && styles.warn)}
      title={current.missing && MISSING}
      value={value}
      onChange={e => {
        if (e.target.value === CUSTOM) {
          setTyping(true)
          onChange('')
        } else if (e.target.value !== BOB_PICKS) onChange(e.target.value) // issue 06: hand the value to Bob
      }}
    >
      {options.map(o => (
        <option
          key={o.value}
          value={o.value}
          className={cx(o.missing && styles.warn)}
          title={o.missing && MISSING}
          style={o.font ? { fontFamily: o.font } : undefined}
        >
          {o.label}
        </option>
      ))}
      <option value={BOB_PICKS}>💡 Bob picks</option>
      <option value={CUSTOM}>custom…</option>
    </select>
  )
}

type At = { left: number; top: number }

function ColorMenu({ at, value, onChange, onClose }: { at: At; value: string; onChange: (v: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
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
  return createPortal(
    <div ref={ref} className={styles.colorMenu} style={at} onPointerDown={e => e.stopPropagation()}>
      <div className={styles.colorTitle}>Colors</div>
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
      </div>
    </div>,
    document.body,
  )
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [at, setAt] = useState<At | null>(null)
  return (
    <>
      <button
        className={styles.color}
        // While open, keep the menu's outside listener from closing it before this click toggles it.
        onPointerDown={e => { if (at) e.nativeEvent.stopImmediatePropagation() }}
        onClick={e => {
          const r = e.currentTarget.getBoundingClientRect()
          setAt(at ? null : { left: Math.min(r.left, innerWidth - 230), top: Math.min(r.bottom + 4, innerHeight - 150) })
        }}
      >
        <span className={styles.swatch} style={{ background: value }} />
        {COLOR_PRESETS.find(c => c.hex === value.toUpperCase())?.name ?? value}
      </button>
      {at && <ColorMenu at={at} value={value} onChange={onChange} onClose={() => setAt(null)} />}
    </>
  )
}

function ValueField({ p, t }: { p: Project; t: Trait }) {
  const type = TRAIT_TYPES[t.type]
  const set = (v: string) => updateProject(d => { d.traits[t.id].value = v })
  switch (type.valueKind) {
    case 'text':
      return <LongText value={t.value} placeholder={type.hint} onChange={set} />
    case 'color':
      return <ColorField value={t.value} onChange={set} />
    case 'choice':
      return <Dropdown value={t.value} onChange={set} back={type.default}
        options={type.choices!.map(c => ({ value: c, label: c, font: t.type === 'font' ? c : undefined }))} />
    case 'action':
      return <Dropdown value={t.value} onChange={set} back={type.default} options={onClickOptions(p, t.id)} />
    case 'asset': {
      const options: Option[] = [
        { value: '', label: 'pick from Library' },
        ...p.assets.filter(a => a.kind === t.type).map(a => ({ value: a.id, label: a.file })),
      ]
      if (/^a\d+$/.test(t.value) && !options.some(o => o.value === t.value)) options.push({ value: t.value, label: 'missing file', missing: true })
      return <Dropdown value={t.value} onChange={set} back="" options={options} />
    }
  }
}

// inInst is for issue 07's short marker.
export default function TraitPill({ p, id }: { p: Project; id: string; inInst?: boolean }) {
  const drag = useDrag()
  const t = p.traits[id]
  if (!t) return null
  const type = TRAIT_TYPES[t.type]
  const Icon = ICONS[type.icon]
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
      // issue 06: onContextMenu = openMenu(e, id)
    >
      <Icon weight="fill" size={16} />
      {type.label}
      {/* issue 06: the Bob picks chip instead of the value when bobPicks */}
      <ValueField p={p} t={t} />
      {/* issue 06: bulb button, Trait Note. issue 07: short marker. issue 08: <Mark id> */}
    </span>
  )
}
