import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { ICONS } from '../icons.ts'
import { BLOCK_TYPES } from '../model/catalogue.ts'
import type { Checkpoint } from '../model/types.ts'
import { listCheckpoints } from '../db.ts'
import { holding } from '../model/project.ts'
import { buildOf, checkpointTitle, fromTag, gist, renameCheckpoint, restoreCheckpoint, saveCheckpoint, warning } from '../checkpoints.ts'
import { topBlock } from '../instructions/warnings.ts'
import { useBuild, useStarting } from '../build.ts'
import { findBlockCode } from '../code/code.ts'
import { clearCheckpointFocus, seeItsCode, useCheckpointFocus } from '../code/navigation.ts'
import { getProject, updateProject, useProject } from '../store.ts'
import { cx } from '../canvas/cx.ts'
import { Warning } from '../shell/Warning.tsx'
import styles from './Checkpoints.module.css'

interface Picked { n: number; id: string; flash?: boolean }

export default function Checkpoints() {
  const p = useProject()
  const focus = useCheckpointFocus()
  const starting = useStarting()
  const building = useBuild()?.state === 'running' || starting
  const [cps, setCps] = useState<Checkpoint[] | null>(null)
  const [reload, setReload] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [ask, setAsk] = useState<Checkpoint | null>(null)
  const [renaming, setRenaming] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [refocus, setRefocus] = useState<number | null>(null) // after Enter or Escape, keyboard focus returns to that rename button
  const flashRow = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let live = true
    listCheckpoints(p.id).then(list => { if (live) setCps(list) }).catch(e => console.error('Loading the Checkpoints failed', e))
    return () => { live = false }
  }, [p.id, p.checkpoint, reload])

  useEffect(() => {
    if (!focus || !cps) return
    const c = buildOf(focus, getProject(), cps)
    setOpen(c ? c.number : null)
    if (c) setPicked({ n: c.number, id: focus, flash: true })
    clearCheckpointFocus()
  }, [focus, cps])

  useEffect(() => {
    if (picked?.flash) flashRow.current?.scrollIntoView({ block: 'center' })
  }, [picked])

  async function restore(c: Checkpoint, save: boolean) {
    setAsk(null)
    try {
      await restoreCheckpoint(c.number, save)
    } catch (e) {
      console.error('Restoring the Checkpoint failed', e)
      return
    }
    setReload(r => r + 1)
  }

  async function save() {
    let n: number
    try {
      n = await saveCheckpoint()
    } catch (e) {
      console.error('Saving the Checkpoint failed', e)
      return
    }
    setReload(r => r + 1)
    startRename(n)
  }

  function startRename(n: number) {
    setRenaming(n)
    setRefocus(null)
    setDraft(p.checkpointNames?.[n] ?? '')
  }

  function endRename(n: number, save: boolean) {
    setRenaming(null)
    setRefocus(n)
    if (save && draft.trim() !== (getProject().checkpointNames?.[n] ?? '')) updateProject(d => renameCheckpoint(d, n, draft))
  }

  function tree(n: number, blocks: Checkpoint['canvas']['blocks'], id: string): ReactNode {
    const b = blocks[id]
    if (!b || b.type === 'canvas') return null
    const Icon = ICONS[b.locked ? 'checkpoint' : b.inst ? 'custom' : BLOCK_TYPES[b.type].icon]
    const cat = b.inst ? 'my' : BLOCK_TYPES[b.type].category
    const isPicked = picked?.n === n && picked.id === id
    return (
      <li key={id}>
        <span
          ref={isPicked && picked.flash ? flashRow : undefined}
          className={cx(styles.row, b.locked || b.type === 'site' ? styles.built : `cat-${cat}`, isPicked && styles.picked, isPicked && picked.flash && styles.flash)}
          onClick={() => setPicked({ n, id })}
        >
          <button className={styles.pick}>
            <Icon weight="fill" size={16} />
            {b.name}
            {b.file && <span className={styles.file}>{b.file}</span>}
          </button>
          {isPicked && findBlockCode(p.files, id) && (
            <button className={styles.see} onClick={e => { e.stopPropagation(); seeItsCode(id) }}>{'</> See its code'}</button>
          )}
        </span>
        {b.children.length > 0 && <ul>{b.children.map(c => tree(n, blocks, c))}</ul>}
      </li>
    )
  }

  if (!cps) return <div className={styles.panel} />

  const current = holding(p, cps)
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.heading}>Checkpoints</h2>
          <p className={styles.hint}>Saved versions of your Blocks and code. Every Build saves one first.</p>
        </div>
        <button className={styles.save} disabled={!!current || building} title={current ? 'Nothing new to save.' : undefined} onClick={save}>Save Checkpoint</button>
      </div>
      {cps.length === 0 && (
        <div className={styles.empty}>
          <img className={styles.bob} src="/bob-head.svg" alt="" />
          No Checkpoints yet. Save one, or Build, and it shows up here.
        </div>
      )}
      {[...cps].reverse().map(c => {
        const here = p.checkpoint === c.number
        const tag = fromTag(c, p)
        const isOpen = open === c.number
        const top = topBlock(c.canvas)
        return (
          <article key={c.number} className={cx(styles.entry, here && styles.here)}>
            <div className={styles.title}>
              {renaming === c.number ? (
                <>
                  <h3>Checkpoint {c.number}</h3>
                  <input
                    className={styles.nameInput}
                    autoFocus
                    maxLength={40}
                    aria-label={`Name for Checkpoint ${c.number}`}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') endRename(c.number, true)
                      else if (e.key === 'Escape') endRename(c.number, false)
                    }}
                    onBlur={() => setRenaming(null)}
                  />
                </>
              ) : (
                <h3>{checkpointTitle(p, c.number)}</h3>
              )}
              {renaming !== c.number && (
                <button className={styles.rename} title="Rename" aria-label={`Rename Checkpoint ${c.number}`} autoFocus={refocus === c.number} onClick={() => startRename(c.number)}>
                  <PencilSimpleIcon size={14} weight="fill" />
                </button>
              )}
              <span className={styles.time}>{new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {tag && <span className={styles.tag}>{tag}</span>}
              {here && <span className={cx(styles.tag, styles.hereTag)}>you are here{current !== c && ' + changes'}</span>}
            </div>
            <p className={styles.gist}>{gist(c, p)}</p>
            <div className={styles.actions}>
              <button className={styles.ghost} disabled={building} onClick={() => setAsk(c)}>Restore</button>
              {top && (
                <button
                  className={styles.link}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : c.number)}
                >
                  {isOpen ? 'Hide its Blocks' : 'Show its Blocks'}
                </button>
              )}
            </div>
            {isOpen && top && <ul className={styles.tree}>{tree(c.number, c.canvas.blocks, top.id)}</ul>}
          </article>
        )
      })}
      {ask && (() => {
        const { title, lines, unsaved } = warning(p, cps, ask)
        const icon = ICONS.tab_checkpoints
        return unsaved
          ? <Warning icon={icon} title={title} lines={lines} confirm="Save and restore" onConfirm={() => restore(ask, true)}
              extra={{ label: 'Restore without saving', onClick: () => restore(ask, false) }} onCancel={() => setAsk(null)} />
          : <Warning icon={icon} title={title} lines={lines} confirm="Restore" onConfirm={() => restore(ask, false)} onCancel={() => setAsk(null)} />
      })()}
    </div>
  )
}
