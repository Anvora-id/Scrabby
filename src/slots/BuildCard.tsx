import { useEffect, useRef, useState } from 'react'
import { FAILURE_LINES, progress, runBuild, useBuild, useStarting, type BuildRun } from '../build.ts'
import { cx } from '../canvas/cx.ts'
import { ICONS, type IconKey } from '../icons.ts'
import { BLOCK_TYPES } from '../model/catalogue.ts'
import BobBadge from '../shell/BobBadge.tsx'
import { setStep, useProject } from '../store.ts'
import BuildButton from './BuildButton.tsx'
import styles from './Build.module.css'

type StageState = 'idle' | BuildRun['state']

// Brick widths per row, bottom-up, in 36px units (DESIGN.md Build card, item 2). Every row closes flush, so the pile packs tight.
const ROWS = [[3, 2, 2, 3], [2, 3, 1, 2, 2], [1, 2, 3, 3, 1], [3, 1, 2, 2, 2], [2, 2, 3, 1, 2], [1, 3, 2, 2, 2], [2, 1, 3, 1, 3]]
const COLORS = ['pages', 'ui', 'prim', 'my', 'site', 'content', 'design', 'behavior', 'bob']
const UNIT = 36
const ROW = 22
const BRICKS = ROWS.flatMap((widths, row) => widths.map((w, i) => ({ row, left: widths.slice(0, i).reduce((a, b) => a + b, 0) * UNIT, width: w * UNIT - 2 })))
  .map((b, i) => ({ ...b, cat: COLORS[i % COLORS.length] }))
const EASE = 'cubic-bezier(.3, .7, .4, 1)'
const FALL = 'cubic-bezier(.55, 0, 1, .45)'
// Seconds: bricks fall 0.2s apart, the full pile holds, then the rows clear from the bottom, 0.4s each.
const LOOP = 11
const HOLD = 8
const CLEAR = 0.4

function BuildStage({ state }: { state: StageState }) {
  const base = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state !== 'running' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const at = (s: number) => s / LOOP
    const y = (px: number, scale = '1') => `translateY(${px}px) scale(${scale})`
    const anims = BRICKS.map(({ row }, i) => {
      const t = 0.4 + i * 0.2
      const frames: Keyframe[] = [
        { offset: 0, transform: y(-240), opacity: 0 },
        { offset: at(t), transform: y(-240), opacity: 0, easing: FALL },
        { offset: at(t + 0.25), transform: y(0, '1.03, .88'), opacity: 1, easing: EASE },
        { offset: at(t + 0.4), transform: y(0), opacity: 1 },
      ]
      // Each row cleared under this brick drops it one row; then it reaches the bottom, flashes and goes.
      for (let k = 0; k < row; k++) {
        frames.push(
          { offset: at(HOLD + k * CLEAR + 0.15), transform: y(ROW * k), opacity: 1, easing: EASE },
          { offset: at(HOLD + k * CLEAR + 0.3), transform: y(ROW * (k + 1)), opacity: 1 },
        )
      }
      const gone = HOLD + row * CLEAR
      frames.push(
        { offset: at(gone), transform: y(ROW * row), opacity: 1, filter: 'brightness(1)' },
        { offset: at(gone + 0.07), transform: y(ROW * row, '1.03'), opacity: 1, filter: 'brightness(1.4)' },
        { offset: at(gone + 0.15), transform: y(ROW * row, '1.03, 0'), opacity: 0, filter: 'brightness(1.4)' },
        { offset: 1, transform: y(ROW * row, '1.03, 0'), opacity: 0, filter: 'brightness(1.4)' },
      )
      return base.current!.children[i].animate(frames, { duration: LOOP * 1000, iterations: Infinity })
    })
    return () => anims.forEach(a => a.cancel())
  }, [state])

  return (
    <div className={cx(styles.stage, styles[`stage-${state}`])} aria-hidden>
      <span className={styles.caption}>Bob is putting your Blocks together…</span>
      <div className={styles.base} ref={base}>
        {BRICKS.map(({ row, left, width, cat }, i) => (
          <span key={i} className={cx(`cat-${cat}`, styles.brick)} style={{ left, bottom: row * ROW, width, height: ROW - 2 }} />
        ))}
      </div>
      <img className={styles.bob} src="/bob.svg" alt="" />
    </div>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
// Past this many chips they fold into one row, so a big Build doesn't bury the card.
const FOLD_AT = 12

export default function BuildCard() {
  const run = useBuild()
  const starting = useStarting()
  const p = useProject()
  const [open, setOpen] = useState(true)
  // The Blocks leave the Project when the Build ends, so remember each chip's icon while they are there.
  const icons = useRef<Record<string, IconKey>>({})
  const list = useRef<HTMLDivElement>(null)
  const { done, working } = run ? progress(run) : { done: new Set<string>(), working: undefined }

  // The open list scrolls past about 5 rows: keep the chip Bob is on in the middle of it.
  useEffect(() => {
    const chip = list.current?.querySelector<HTMLElement>(`.${styles.working}`)
    if (chip) list.current!.scrollTop = chip.offsetTop - (list.current!.clientHeight - chip.offsetHeight) / 2
  }, [working, open])

  if (!run) {
    return (
      <div className={styles.card}>
        <h2 className={styles.title}>Nothing built yet</h2>
        <BuildStage state="idle" />
        <div><BuildButton /></div>
      </div>
    )
  }

  const failed = run.state === 'failed'
  for (const c of run.chips) {
    const b = p.blocks[c.id]
    if (b && b.type !== 'canvas') icons.current[c.id] = b.inst ? 'custom' : BLOCK_TYPES[b.type].icon
  }
  const notes = [...run.skipped, ...run.loose > 0 ? [`${plural(run.loose, 'loose idea')} skipped`] : []]
  const chip = (c: BuildRun['chips'][number]) => {
    const Icon = icons.current[c.id] && ICONS[icons.current[c.id]]
    return (
      <span key={c.id} className={cx(`cat-${c.category}`, styles.chip, done.has(c.id) && styles.done, c.id === working && styles.working)}>
        {Icon && <Icon weight="fill" size={14} />}{c.name}
      </span>
    )
  }
  const workingChip = run.chips.find(c => c.id === working)

  function tryAgain() {
    runBuild().catch(e => console.error('The Build failed to run', e))
  }

  return (
    <div className={cx(styles.card, failed && styles.failed)}>
      <div>
        <h2 className={styles.title}>
          {run.state === 'running' && <><span className={styles.spinner} /><span className={styles.bobTitle}>Bob is building your website</span><span className={styles.end}><BobBadge /></span></>}
          {run.state === 'done' && <><span className={styles.doneMark}>✓</span>Build {run.n} done</>}
          {failed && <><span className={cx(styles.bang, styles.bigBang)}>!</span>{run.n ? `Build ${run.n}` : 'Your Build'} {run.reason === 'limit' || run.reason === 'start' || run.reason === 'save' ? 'did not start' : 'did not finish'}</>}
        </h2>
        {run.state === 'done' && <p className={styles.sub}>Opening your website…</p>}
        {failed && <p className={styles.sub}>Nothing changed: your code and Blocks are as they were.</p>}
      </div>
      <BuildStage state={run.state} />
      {run.chips.length > FOLD_AT ? (
        <div>
          <button className={styles.fold} aria-expanded={open} aria-controls="build-chips" onClick={() => setOpen(!open)}>
            <ICONS.fold weight="fill" size={12} className={cx(styles.chevron, !open && styles.turned)} />
            {run.chips.length} Blocks · {done.size} done
            {!open && workingChip && <span className={styles.end}>{chip(workingChip)}</span>}
          </button>
          <div id="build-chips" className={cx(styles.drawer, open && styles.open)} aria-hidden={!open}>
            <div><div className={styles.chips} ref={list}>{run.chips.map(chip)}</div></div>
          </div>
        </div>
      ) : <div className={styles.chips}>{run.chips.map(chip)}</div>}
      {notes.length > 0 && (
        <ul className={styles.notes}>
          {notes.map((s, i) => <li key={i}><span className={styles.dash}>–</span>{s}</li>)}
        </ul>
      )}
      {failed && (
        <div>
          {run.reason && <p className={styles.failRow}><span className={styles.bang}>!</span><span className={styles.failLine}>{run.message ?? FAILURE_LINES[run.reason]}</span></p>}
          <div className={styles.actions}>
            <button className={styles.primary} disabled={starting} onClick={tryAgain}>
              {starting && <span className={styles.buttonSpinner} />}{starting ? 'Starting…' : 'Try again'}
            </button>
            <button className={styles.ghost} onClick={() => setStep('plan')}>← Back to the Blocks</button>
          </div>
        </div>
      )}
    </div>
  )
}
