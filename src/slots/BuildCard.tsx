import { useEffect, useRef, useState } from 'react'
import { FAILURE_LINES, progress, runBuild, useBuild, type BuildRun } from '../build.ts'
import { cx } from '../canvas/cx.ts'
import { ICONS, type IconKey } from '../icons.ts'
import { BLOCK_TYPES } from '../model/catalogue.ts'
import BobBadge from '../shell/BobBadge.tsx'
import { setStep, useProject } from '../store.ts'
import BuildButton from './BuildButton.tsx'
import styles from './Build.module.css'

type StageState = 'idle' | BuildRun['state']

// category, left, bottom, width, height, kind (DESIGN.md Build card, item 2): the Site lot, then the bricks course by course, left to right
const PIECES: [string, number, number, number, number, 'lot' | 'brick' | 'sticker'][] = [
  ['site', 0, 0, 292, 96, 'lot'],
  ['pages', 8, 8, 44, 12, 'brick'],
  ['pages', 60, 8, 52, 12, 'brick'],
  ['ui', 120, 8, 48, 12, 'brick'],
  ['pages', 176, 8, 56, 12, 'brick'],
  ['ui', 240, 8, 44, 12, 'brick'],
  ['prim', 12, 22, 36, 12, 'brick'],
  ['ui', 64, 22, 44, 12, 'brick'],
  ['content', 130, 22, 28, 8, 'sticker'],
  ['behavior', 180, 22, 48, 12, 'brick'],
  ['my', 244, 22, 36, 12, 'brick'],
  ['design', 18, 36, 24, 8, 'sticker'],
  ['prim', 68, 36, 36, 12, 'brick'],
  ['my', 186, 36, 36, 12, 'brick'],
  ['bob', 250, 36, 24, 8, 'sticker'],
  ['behavior', 72, 50, 28, 12, 'brick'],
  ['content', 194, 50, 20, 8, 'sticker'],
  ['design', 78, 64, 16, 7, 'sticker'],
]
const EASE = 'cubic-bezier(.3, .7, .4, 1)'

function BuildStage({ state }: { state: StageState }) {
  const base = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state !== 'running' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Each piece drops 0.28s after the one before it and pops away from 88% of the 8s loop.
    const anims = [...base.current!.children].map((el, i) => {
      const t = i * 0.28 / 8
      const out = 0.88 + i * 0.005
      return el.animate([
        { offset: 0, transform: 'translateY(-190px)', opacity: 0 },
        { offset: t, transform: 'translateY(-190px)', opacity: 0 },
        { offset: t + 0.04, transform: 'scale(1.12, .8)', opacity: 1 },
        { offset: t + 0.055, transform: 'translateY(-6px) scale(.95, 1.06)', opacity: 1 },
        { offset: t + 0.07, transform: 'none', opacity: 1 },
        { offset: out, transform: 'none', opacity: 1 },
        { offset: out + 0.01, transform: 'scale(1.1)', opacity: 1 },
        { offset: out + 0.02, transform: 'scale(0)', opacity: 0 },
        { offset: 1, transform: 'scale(0)', opacity: 0 },
      ].map(k => ({ ...k, easing: EASE })), { duration: 8000, iterations: Infinity })
    })
    return () => anims.forEach(a => a.cancel())
  }, [state])

  return (
    <div className={cx(styles.stage, styles[`stage-${state}`])} aria-hidden>
      <span className={styles.caption}>Bob is putting your Blocks together…</span>
      <div className={styles.base} ref={base}>
        {PIECES.map(([cat, left, bottom, width, height, kind], i) => (
          <span key={i} className={cx(`cat-${cat}`, styles[kind])} style={{ left, bottom, width, height }} />
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
  const p = useProject()
  const [limit, setLimit] = useState<string>()
  const [open, setOpen] = useState(false)
  // The Blocks leave the Project when the Build ends, so remember each chip's icon while they are there.
  const icons = useRef<Record<string, IconKey>>({})

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
  const { done, working } = progress(run)
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
  const chips = <div className={styles.chips}>{run.chips.map(chip)}</div>
  const current = run.chips.find(c => c.id === working)

  async function tryAgain() {
    setLimit(undefined)
    setLimit(await runBuild().catch(e => { console.error('The Build failed to run', e); return undefined }))
  }

  return (
    <div className={cx(styles.card, failed && styles.failed)}>
      <div>
        <h2 className={styles.title}>
          {run.state === 'running' && <><span className={styles.spinner} /><span className={styles.bobTitle}>Bob is building your website</span><span className={styles.end}><BobBadge /></span></>}
          {run.state === 'done' && <><span className={styles.doneMark}>✓</span>Build {run.n} done</>}
          {failed && <><span className={cx(styles.bang, styles.bigBang)}>!</span>Build {run.n} did not finish</>}
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
            {!open && current && <span className={styles.end}>{chip(current)}</span>}
          </button>
          <div id="build-chips" className={cx(styles.drawer, open && styles.open)} aria-hidden={!open}>
            <div>{chips}</div>
          </div>
        </div>
      ) : chips}
      {notes.length > 0 && (
        <ul className={styles.notes}>
          {notes.map((s, i) => <li key={i}><span className={styles.dash}>–</span>{s}</li>)}
        </ul>
      )}
      {failed && (
        <div>
          {run.reason && <p className={styles.failRow}><span className={styles.bang}>!</span><span className={styles.failLine}>{FAILURE_LINES[run.reason]}</span></p>}
          <div className={styles.actions}>
            <button className={styles.primary} onClick={tryAgain}>Try again</button>
            <button className={styles.ghost} onClick={() => setStep('plan')}>← Back to the Blocks</button>
          </div>
          {limit && <p className={styles.failLine}>{limit}</p>}
        </div>
      )}
    </div>
  )
}
