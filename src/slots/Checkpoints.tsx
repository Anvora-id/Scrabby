import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { ICONS } from '../icons.ts'
import { BLOCK_TYPES } from '../model/catalogue.ts'
import type { BuiltBlocks, Checkpoint } from '../model/types.ts'
import { listCheckpoints } from '../db.ts'
import { buildOf, checkpointTitle, fromTag, gist, loadCheckpoint, renameCheckpoint, sameFiles, warning, type LoadMode } from '../checkpoints.ts'
import { findBlockCode } from '../code/code.ts'
import { clearCheckpointFocus, seeItsCode, useCheckpointFocus } from '../code/navigation.ts'
import { getProject, setPlanTab, updateProject, useProject } from '../store.ts'
import { cx } from '../canvas/cx.ts'
import styles from './Checkpoints.module.css'

interface Picked { n: number; id: string; flash?: boolean }

export default function Checkpoints() {
  const p = useProject()
  const focus = useCheckpointFocus()
  const [cps, setCps] = useState<Checkpoint[] | null>(null)
  const [reload, setReload] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [ask, setAsk] = useState<{ c: Checkpoint; mode: LoadMode } | null>(null)
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

  async function confirm(c: Checkpoint, mode: LoadMode) {
    setAsk(null)
    try {
      await loadCheckpoint(c.number, mode)
    } catch (e) {
      console.error('Loading the Checkpoint failed', e)
      return
    }
    setReload(r => r + 1)
    if (mode === 'edit') setPlanTab('canvas')
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

  function tree(n: number, bb: BuiltBlocks, id: string): ReactNode {
    const b = bb.blocks[id]
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
        {b.children.length > 0 && <ul>{b.children.map(c => tree(n, bb, c))}</ul>}
      </li>
    )
  }

  if (!cps) return <div className={styles.panel} />

  return (
    <div className={styles.panel}>
      {cps.length === 0 && (
        <div className={styles.empty}>
          <img className={styles.bob} src="/bob-head.svg" alt="" />
          No Checkpoints yet. Every Build saves one here.
        </div>
      )}
      {[...cps].reverse().map(c => {
        const here = p.checkpoint === c.number
        const tag = fromTag(c, p)
        const isOpen = open === c.number
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
              {!c.blocks && <span className={cx(styles.tag, styles.saved)}>saved for you</span>}
              {here && <span className={cx(styles.tag, styles.hereTag)}>you are here{!sameFiles(p.files, c.after) && ' + hand edits'}</span>}
            </div>
            <p className={styles.gist}>{gist(c, p)}</p>
            <div className={styles.actions}>
              <button className={styles.ghost} onClick={() => setAsk({ c, mode: 'goBack' })}>Go back to this</button>
              {c.blocks && (
                <>
                  <button className={styles.ghost} onClick={() => setAsk({ c, mode: 'edit' })}>Edit its Blocks</button>
                  <button
                    className={styles.link}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : c.number)}
                  >
                    {isOpen ? 'Hide its Blocks' : 'Show its Blocks'}
                  </button>
                </>
              )}
            </div>
            {isOpen && c.blocks && <ul className={styles.tree}>{tree(c.number, c.blocks, c.blocks.top[0])}</ul>}
          </article>
        )
      })}
      {ask && (
        <Warning
          {...warning(p, cps, ask.c, ask.mode)}
          onCancel={() => setAsk(null)}
          onConfirm={() => confirm(ask.c, ask.mode)}
        />
      )}
    </div>
  )
}

interface WarningProps { title: string; lines: string[]; confirm: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }

export function Warning({ title, lines, confirm, danger, onCancel, onConfirm }: WarningProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return (
    <dialog ref={ref} className={styles.dialog} onClose={onCancel}>
      <h2>{title}</h2>
      <div className={styles.body}>
        {lines.map(l => <p key={l}>{l}</p>)}
        <div className={styles.buttons}>
          <button className={styles.text} onClick={onCancel}>Cancel</button>
          <button className={cx(styles.primary, danger && styles.danger)} onClick={onConfirm} autoFocus>{confirm}</button>
        </div>
      </div>
    </dialog>
  )
}
