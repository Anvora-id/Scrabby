import { useEffect, useRef, useState } from 'react'
import { FAILURE_LINES, runBuild, useBuild, type BuildRun } from '../build.ts'
import { cx } from '../canvas/cx.ts'
import { ICONS, type IconKey } from '../icons.ts'
import { BLOCK_TYPES } from '../model/catalogue.ts'
import BobBadge from '../shell/BobBadge.tsx'
import { setStep, useProject } from '../store.ts'
import BuildButton from './BuildButton.tsx'
import styles from './Build.module.css'

type StageState = 'idle' | BuildRun['state']

// category, left, bottom, width, height, sticker (DESIGN.md Build card, item 2)
const PIECES: [string, number, number, number, number, boolean][] = [
  ['site', 0, 0, 236, 22, false],
  ['ui', 8, 25, 220, 18, false],
  ['pages', 8, 46, 106, 40, false],
  ['pages', 122, 46, 106, 40, false],
  ['prim', 16, 89, 54, 20, false],
  ['content', 74, 89, 34, 16, true],
  ['design', 128, 89, 44, 16, true],
  ['behavior', 176, 89, 46, 20, false],
  ['bob', 40, 112, 60, 16, true],
  ['my', 140, 112, 64, 22, false],
]
const EASE = 'cubic-bezier(.3, .7, .4, 1)'

function BuildStage({ state }: { state: StageState }) {
  const base = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state !== 'running' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Each piece drops 0.55s after the one below it and pops away from 88% of the 7s loop.
    const anims = [...base.current!.children].map((el, i) => {
      const t = i * 0.55 / 7
      const out = 0.88 + i * 0.01
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
      ].map(k => ({ ...k, easing: EASE })), { duration: 7000, iterations: Infinity })
    })
    return () => anims.forEach(a => a.cancel())
  }, [state])

  return (
    <div className={cx(styles.stage, styles[`stage-${state}`])} aria-hidden>
      <span className={styles.caption}>Bob is putting your Blocks together…</span>
      <div className={styles.base} ref={base}>
        {PIECES.map(([cat, left, bottom, width, height, sticker], i) => (
          <span key={i} className={cx(`cat-${cat}`, sticker ? styles.miniSticker : styles.miniBlock)} style={{ left, bottom, width, height }} />
        ))}
      </div>
      <img className={styles.bob} src="/bob.svg" alt="" />
    </div>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function BuildCard() {
  const run = useBuild()
  const p = useProject()
  const [limit, setLimit] = useState<string>()
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
  const lit = new Set(run.lit)
  const building = [...lit].flatMap(id => run.chips.filter(c => c.id === id))
  for (const c of run.chips) {
    const b = p.blocks[c.id]
    if (b && b.type !== 'canvas') icons.current[c.id] = b.inst ? 'custom' : BLOCK_TYPES[b.type].icon
  }
  const check = <span className={styles.check}>✓</span>
  const bang = <span className={styles.bang}>!</span>

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
      <div className={styles.chips}>
        {run.chips.map(c => {
          const Icon = icons.current[c.id] && ICONS[icons.current[c.id]]
          return (
            <span key={c.id} className={cx(`cat-${c.category}`, styles.chip, lit.has(c.id) && !failed && styles.lit)}>
              {Icon && <Icon weight="fill" size={14} />}{c.name}
            </span>
          )
        })}
      </div>
      <ul className={styles.lines}>
        <li>{check}Reading your Blocks ({plural(run.chips.length, 'Block')}{run.loose > 0 && `, ${plural(run.loose, 'loose idea')} skipped`})</li>
        {building.map((c, i) => (
          <li key={c.id} className={cx(run.state === 'running' && i === building.length - 1 && styles.current)}>
            {run.state === 'running' && i === building.length - 1 ? <span className={styles.markSlot}><span className={styles.smallSpinner} /></span> : check}
            Building {c.name}
          </li>
        ))}
        {run.skipped.map(s => <li key={s} className={styles.skip}><span className={styles.dash}>–</span>{s}</li>)}
        {failed && run.reason && <li>{bang}<span className={styles.failLine}>{FAILURE_LINES[run.reason]}</span></li>}
      </ul>
      {failed && (
        <div>
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
