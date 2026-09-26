import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ICONS } from '../icons.ts'
import { BLOCK_TYPES, TRAIT_TYPES } from '../model/catalogue.ts'
import type { CustomBlockDef, Layout, Project } from '../model/types.ts'
import { hasOverride } from '../model/project.ts'
import { setEditing, updateProject } from '../store.ts'
import { cx } from './cx.ts'
import { dragSource, useDrag } from './drag.ts'
import { insertInto, isTraitItem, repairLayout } from './tree.ts'
import TraitPill, { TextField } from './TraitPill.tsx'
import { BlockNote, openMenu } from './Overlays.tsx'
import styles from './parts.module.css'
import o from './Overlays.module.css'

const GHOST = '\u0000ghost'

export function customColor({ h, s, l }: CustomBlockDef['color']): CSSProperties {
  const c = (n: number) => Math.min(100, Math.max(0, n))
  return {
    '--c1': `hsl(${h} ${c(s)} ${c(l)})`,
    '--c2': `hsl(${h} ${c(s)} ${c(l - 9)})`,
    '--c3': `hsl(${h} ${c(s - 25)} ${c(l - 26)})`,
    '--c4': `hsl(${h} 100 92.6)`,
    ...(l < 55 && { '--ink': '#fff' }),
  } as CSSProperties
}

function LayoutView({ l, p, depth, inInst, ghost }: { l: Layout; p: Project; depth: number; inInst: boolean; ghost: ReactNode }) {
  return (
    <div className={l.d === 'row' ? styles.row : styles.col}>
      {l.k.map((k, i) =>
        typeof k !== 'string' ? <LayoutView key={i} l={k} p={p} depth={depth} inInst={inInst} ghost={ghost} />
        : k === GHOST ? <Fragment key={k}>{ghost}</Fragment>
        : <BlockView key={k} p={p} id={k} depth={depth} inInst={inInst} />,
      )}
    </div>
  )
}

// inInst is for issue 07's header marker; children get inInst || b.inst.
export default function BlockView({ p, id, depth = 1, inInst = false }: { p: Project; id: string; depth?: number; inInst?: boolean }) {
  const drag = useDrag()
  const b = p.blocks[id]
  if (!b || b.type === 'canvas') return null
  const type = BLOCK_TYPES[b.type]
  const custom = b.inst ?? b.defines
  const def = custom ? p.defs[custom] : undefined
  const checkpoint = b.type === 'checkpoint'
  const folded = !checkpoint && (b.folded ?? depth >= 4)
  const target = drag?.target?.id === id ? drag.target : null
  const blockDrop = !!target && !isTraitItem(drag!.item)
  const liftedBlock = drag?.item.kind === 'block' ? drag.item.id : null
  const liftedTrait = drag?.item.kind === 'trait' ? drag.item.id : null
  const childInst = inInst || !!b.inst
  const Icon = ICONS[custom ? 'custom' : type.icon]

  const ghost = (pill: boolean) => (
    <div data-ghost className={cx(styles.ghost, pill && styles.ghostPill)} style={{ width: drag!.w, height: drag!.h }} />
  )

  // The Trait ghost goes before the pill it lands in front of, counting pills that are not lifted; '' = at the end.
  const shown = b.traits.filter(t => t !== liftedTrait)
  const ghostBefore = target?.tIdx === undefined ? null : shown[target.tIdx] ?? ''

  const empty = !b.children.some(c => c !== liftedBlock) && !blockDrop

  return (
    <div
      data-bid={id}
      className={cx(
        styles.block,
        checkpoint ? styles.checkpoint : b.type === 'site' ? styles.site : b.locked ? styles.lockedPage : custom ? 'cat-my' : `cat-${type.category}`,
        b.inst && styles.inst,
        b.defines && styles.def,
        target && styles.over,
        liftedBlock === id && styles.lifted,
        p.blocks.canvas.children.includes(id) && b.type !== 'site' && !checkpoint && styles.loose,
      )}
      style={def && customColor(def.color)}
      onPointerDown={b.defines ? undefined : dragSource({ kind: 'block', id })}
      onContextMenu={e => openMenu(e, id)}
    >
      <div className={cx(styles.header, !drag && styles.pressable)} data-tip={`b:${id}`}>
        {!checkpoint && (
          <button className={o.fold} title={folded ? 'Open this Block' : 'Fold this Block'}
            onClick={() => updateProject(d => { d.blocks[id].folded = !folded })}>
            <ICONS.fold weight="fill" size={12} className={cx(o.chevron, folded && o.turned)} />
          </button>
        )}
        {checkpoint ? (
          <>
            <ICONS.checkpoint weight="fill" size={16} />
            Checkpoint
            <span className={styles.hint}>the built site</span>
          </>
        ) : b.locked ? (
          <>
            <ICONS.checkpoint weight="fill" size={16} />
            Page "{b.name}"
            <span className={styles.hint}>{b.file}</span>
          </>
        ) : (
          <>
            <span className={styles.type}>
              <Icon weight="fill" size={16} />
              {b.inst ? p.blocks[def?.blockId ?? '']?.name : b.defines ? 'Custom Block' : type.label}
            </span>
            <TextField className={styles.name} value={b.name} onChange={v => updateProject(d => { d.blocks[id].name = v })} />
            {b.inst && (
              <button
                className={o.editPill}
                title="Edit this Custom Block"
                onClick={() => setEditing(b.inst!)}
              >Edit</button>
            )}
            {inInst && b.from && hasOverride(b) && <span className={o.marker}>✎ changed here</span>}
            {inInst && !b.from && <span className={o.marker}>+ only here</span>}
          </>
        )}
        {p.blocks.canvas.children.includes(id) && b.type !== 'site' && !checkpoint && <span className={o.badge}>not built</span>}
        {/* issue 08: <Mark id> */}
      </div>
      {(b.note || b.noteOn) && <BlockNote id={id} note={b.note} noteOn={b.noteOn} />}
      {folded ? (
        <div className={o.chips}>
          {b.traits.map(t => {
            const tt = TRAIT_TYPES[p.traits[t].type]
            const TIcon = ICONS[tt.icon]
            return <span key={t} className={o.chip}><TIcon weight="fill" size={16} />{tt.label}</span>
          })}
          {b.children.map(c => {
            const child = p.blocks[c]
            const CIcon = ICONS[child.inst ? 'custom' : BLOCK_TYPES[child.type as Exclude<typeof child.type, 'canvas'>].icon]
            return <span key={c} className={o.chip} onPointerDown={dragSource({ kind: 'block', id: c })}><CIcon weight="fill" size={16} />{child.name}</span>
          })}
          {b.traits.length === 0 && b.children.length === 0 && <span className={cx(o.chip, o.none)}>empty</span>}
          {target && <div data-ghost className={cx(styles.ghost, styles.ghostPill, o.chipGhost)} />}
        </div>
      ) : (
        <>
          <div className={styles.traits}>
            {b.traits.map(t => (
              <Fragment key={t}>
                {t === ghostBefore && ghost(true)}
                <TraitPill p={p} id={t} inInst={childInst} />
              </Fragment>
            ))}
            {ghostBefore === '' && ghost(true)}
          </div>
          {type.accepts.length > 0 && (
            <div className={cx(styles.inside, empty && !b.locked && styles.empty)}>
              {!empty ? (
                <LayoutView
                  l={blockDrop ? insertInto(repairLayout(b), GHOST, target!.slot) : repairLayout(b)}
                  p={p} depth={depth + 1} inInst={childInst} ghost={blockDrop && ghost(false)}
                />
              ) : b.type === 'site' ? (
                <div className={styles.emptyHint}>
                  <img src="/bob.svg" alt="" />
                  Drag a Page into your Site to start.
                </div>
              ) : b.locked && <span className={styles.dropHint}>drop Blocks or Traits here</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
