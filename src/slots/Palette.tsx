import { useEffect, useRef, useState } from 'react'
import { ICONS } from '../icons.ts'
import { BLOCK_TYPES, CATEGORIES, TRAIT_TYPES } from '../model/catalogue.ts'
import type { Category } from '../model/catalogue.ts'
import type { TraitType } from '../model/types.ts'
import { newCustomBlock } from '../model/project.ts'
import { customColor } from '../canvas/BlockView.tsx'
import { cx } from '../canvas/cx.ts'
import { dragSource, useDrag } from '../canvas/drag.ts'
import type { NewBlockType } from '../canvas/tree.ts'
import { setEditing, updateProject, useProject } from '../store.ts'
import parts from '../canvas/parts.module.css'
import styles from './Palette.module.css'

const BLOCKS = Object.entries(BLOCK_TYPES) as [NewBlockType, (typeof BLOCK_TYPES)[NewBlockType]][]
const TRAITS = (Object.entries(TRAIT_TYPES) as [TraitType, (typeof TRAIT_TYPES)[TraitType]][]).filter(([, t]) => !t.stretch)

function MyBlocks() {
  const p = useProject()
  const defs = Object.values(p.defs)

  function makeCustom() {
    let defId = ''
    updateProject(d => { defId = newCustomBlock(d) }, null)
    setEditing(defId)
  }

  return (
    <>
      <button className={styles.makeCustom} onClick={makeCustom}>Make a Custom Block</button>
      <p className={styles.myHint}>Or right-click a Block on the Canvas and choose "Make Custom Block".</p>
      {defs.map(def => {
        const blockName = p.blocks[def.blockId]?.name ?? 'My block'
        const instanceCount = Object.values(p.blocks).filter(b => b.inst === def.id).length
        return (
          <div key={def.id} className={styles.myRow}>
            <div
              className={cx(styles.block, 'cat-my')}
              style={customColor(def.color)}
              title={`${instanceCount} Instance${instanceCount === 1 ? '' : 's'}`}
              onPointerDown={dragSource({ kind: 'newInstance', defId: def.id })}
            >
              <ICONS.custom weight="fill" size={16} />
              {blockName}
            </div>
            <button className={styles.editCustom} onClick={() => setEditing(def.id)}>Edit</button>
          </div>
        )
      })}
    </>
  )
}

export default function Palette() {
  const drag = useDrag()
  const [open, setOpen] = useState(true)
  const [current, setCurrent] = useState<Category>(CATEGORIES[0].id)
  // A fresh object per click, so clicking the same category again scrolls again.
  const [jump, setJump] = useState<{ cat: Category } | null>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = jump && list.current?.querySelector<HTMLElement>(`[data-cat="${jump.cat}"]`)
    if (section) list.current!.scrollTo({ top: section.offsetTop, behavior: 'smooth' })
  }, [jump])

  function onScroll() {
    const el = list.current!
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) return
    let cat = current
    for (const s of el.querySelectorAll<HTMLElement>('section')) if (s.offsetTop <= el.scrollTop + 20) cat = s.dataset.cat as Category
    setCurrent(cat)
  }

  return (
    <div className={cx(styles.palette, drag?.trash && styles.trash)} data-palette>
      <div className={styles.column}>
        <button className={styles.toggle} title="Hide or show the palette" onClick={() => setOpen(!open)}>
          {open ? '⟨' : '⟩'}
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={cx(styles.category, open && c.id === current && styles.on)}
            onClick={() => { setOpen(true); setCurrent(c.id); setJump({ cat: c.id }) }}
          >
            <span className={cx(styles.dot, `cat-${c.id}`)} />
            {c.label}
          </button>
        ))}
      </div>
      {open && (
        <div ref={list} className={styles.list} onScroll={onScroll}>
          {CATEGORIES.map(c => (
            <section key={c.id} data-cat={c.id}>
              <h4>{c.label}</h4>
              {BLOCKS.filter(([, t]) => t.category === c.id).map(([type, t]) => {
                const Icon = ICONS[t.icon]
                return (
                  <div key={type} className={cx(styles.block, `cat-${c.id}`)} data-tip={`nb:${type}`}
                    onPointerDown={dragSource({ kind: 'newBlock', type })}>
                    <Icon weight="fill" size={16} />
                    {t.label}
                  </div>
                )
              })}
              {c.id === 'my' && <MyBlocks />}
              {TRAITS.filter(([, t]) => t.category === c.id).map(([type, t]) => {
                const Icon = ICONS[t.icon]
                return (
                  <span key={type} className={cx(parts.pill, styles.trait, `cat-${c.id}`)} data-tip={`nt:${type}`}
                    onPointerDown={dragSource({ kind: 'newTrait', type })}>
                    <Icon weight="fill" size={16} />
                    {t.label}
                  </span>
                )
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
