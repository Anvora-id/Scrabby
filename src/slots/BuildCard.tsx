import { useEffect, useRef, useState } from 'react'
import { BRICKS, ROW, heap, loose, type Lying } from '../bricks.ts'
import { FAILURE_LINES, progress, runBuild, useBuild, useStarting, type BuildRun } from '../build.ts'
import { cx } from '../canvas/cx.ts'
import { ICONS, type IconKey } from '../icons.ts'
import { BLOCK_TYPES } from '../model/catalogue.ts'
import BobBadge from '../shell/BobBadge.tsx'
import { setStep, useProject } from '../store.ts'
import BuildButton from './BuildButton.tsx'
import styles from './Build.module.css'

type StageState = 'idle' | BuildRun['state']

const EASE = 'cubic-bezier(.3, .7, .4, 1)'
const FALL = 'cubic-bezier(.55, 0, 1, .45)'
// Gravity cut in two halves (exact quadratic curves), so a fallen brick can turn mid-air without its fall stalling.
const DROP = 'cubic-bezier(.333, 0, .667, .333)'
const DROP_ON = 'cubic-bezier(.333, .222, .667, .556)'
const RISE = 'cubic-bezier(.333, .667, .667, 1)'
// Seconds: bricks fall 0.2s apart, the full pile holds, then the rows clear from the bottom, 0.4s each.
const LOOP = 11
const HOLD = 8
const CLEAR = 0.4
const turn = (x: number, y: number, r = 0, sx = 1, sy = 1) => `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx}, ${sy})`
const at = (l: Lying) => turn(l.tx, l.ty, l.r)
const sin = (deg: number) => Math.sin(deg * Math.PI / 180)

function BuildStage({ state, notStarted = false }: { state: StageState; notStarted?: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLDivElement>(null)
  const bob = useRef<HTMLImageElement>(null)
  // Kept across states: the brick loop, the one-off animations of a failure, and where the fallen bricks lie.
  const loop = useRef<Animation[]>([])
  const fx = useRef<Animation[]>([])
  const lying = useRef<Lying[]>([])

  useEffect(() => {
    const box = base.current!
    const els = [...box.children] as HTMLElement[]
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const ms = (n: number) => still ? 0 : n
    const stop = (list: Animation[]) => list.splice(0).forEach(a => a.cancel())
    const lay = (ls: Lying[]) => {
      lying.current = ls
      for (const l of ls) {
        const f = { transform: at(l), opacity: 1 }
        fx.current.push(els[l.i].animate([f, f], { duration: 0, fill: 'forwards' }))
      }
    }
    // The fallen bricks drain down out of the stage, fading, the bottom ones a hair first.
    const flush = () => {
      const ls = lying.current
      lying.current = []
      stop(fx.current)
      box.classList.add(styles.draining)
      return Promise.all(ls.map(l => {
        const a = els[l.i].animate([
          { transform: `translate(0px, 0px) ${at(l)}`, opacity: 1, easing: DROP },
          { transform: `translate(0px, ${l.top + 26}px) ${at(l)}`, opacity: 0 },
        ], { duration: ms(330), delay: ms(Math.min(7, Math.round((BRICKS[l.i].bottom - l.ty) / ROW)) * 10), fill: 'backwards' })
        fx.current.push(a)
        return a.finished
      }))
    }

    if (state === 'running') {
      if (!still) {
        const t0 = (s: number) => s / LOOP
        const y = (px: number, scale = '1') => `translateY(${px}px) scale(${scale})`
        loop.current = BRICKS.map(({ row }, i) => {
          const t = 0.4 + i * 0.2
          const frames: Keyframe[] = [
            { offset: 0, transform: y(-240), opacity: 0 },
            { offset: t0(t), transform: y(-240), opacity: 0, easing: FALL },
            { offset: t0(t + 0.25), transform: y(0, '1.03, .88'), opacity: 1, easing: EASE },
            { offset: t0(t + 0.4), transform: y(0), opacity: 1 },
          ]
          // Each row cleared under this brick drops it one row; then it reaches the bottom, flashes and goes.
          for (let k = 0; k < row; k++) {
            frames.push(
              { offset: t0(HOLD + k * CLEAR + 0.15), transform: y(ROW * k), opacity: 1, easing: EASE },
              { offset: t0(HOLD + k * CLEAR + 0.3), transform: y(ROW * (k + 1)), opacity: 1 },
            )
          }
          const gone = HOLD + row * CLEAR
          frames.push(
            { offset: t0(gone), transform: y(ROW * row), opacity: 1, filter: 'brightness(1)' },
            { offset: t0(gone + 0.07), transform: y(ROW * row, '1.03'), opacity: 1, filter: 'brightness(1.4)' },
            { offset: t0(gone + 0.15), transform: y(ROW * row, '1.03, 0'), opacity: 0, filter: 'brightness(1.4)' },
            { offset: 1, transform: y(ROW * row, '1.03, 0'), opacity: 0, filter: 'brightness(1.4)' },
          )
          return els[i].animate(frames, { duration: LOOP * 1000, iterations: Infinity })
        })
      }
      // Bob is back at work: the last failure's bricks drain away as the loop starts (created after it, so they show on top).
      if (lying.current.length) {
        const css = getComputedStyle(stage.current!)
        flush().then(() => box.classList.remove(styles.draining), () => {})
        const color = (token: string) => ({ backgroundColor: css.getPropertyValue(token).trim() })
        if (!still) fx.current.push(stage.current!.animate([color('--alert-bg'), color('--bob-tint')], 400))
      }
    } else if (state === 'failed' && notStarted) {
      stop(loop.current)
      if (lying.current.length) flush().then(() => lay(loose()), () => {})
      else {
        stop(fx.current)
        lay(loose())
      }
    } else if (state === 'failed') {
      // The bricks standing right now fall from where they are: a running animation outranks the stylesheet that hides them.
      // With no loop (reduced motion) the whole pile stood still, so it all falls.
      const standing = loop.current.length ? BRICKS.flatMap(b => {
        const css = getComputedStyle(els[b.i])
        const m = new DOMMatrixReadOnly(css.transform === 'none' ? undefined : css.transform)
        return +css.opacity > 0.1 && m.d > 0.3 ? [{ b, dy: m.m42 }] : []
      }) : BRICKS.map(b => ({ b, dy: 0 }))
      stop(loop.current)
      stop(fx.current)
      if (!standing.length) lay(loose())
      else {
        const ls = heap(standing)
        lying.current = ls
        if (!still) {
          fx.current.push(bob.current!.animate([
            { transform: 'none', easing: EASE },
            { offset: 0.2, transform: 'translate(0px, 0px) scale(1.06, .9)', easing: RISE },
            { offset: 0.55, transform: 'translate(6px, -10px) scale(1, 1)', easing: DROP },
            { offset: 0.8, transform: 'translate(0px, 0px) scale(1.04, .95)', easing: EASE },
            { offset: 1, transform: 'none' },
          ], 300))
        }
        // Top down, 30ms apart, closer for a big pile so every brick lies still by about 800ms.
        const fall = standing.map((s, k) => ({ ...s, l: ls[k] })).sort((p, q) => (q.b.bottom - q.dy) - (p.b.bottom - p.dy))
        const gap = fall.length > 1 ? Math.min(30, 350 / (fall.length - 1)) : 0
        fall.forEach(({ b, dy, l }, k) => {
          // Tumbles past its resting angle, hits with its low end first, tips 3° too far, rocks back and lies still.
          const s = Math.sign(l.r)
          const spin = l.r + s * Math.min(30, 8 + Math.abs(l.tx) / 4)
          const steep = l.r + s * 10
          const lift = b.width / 2 * Math.abs(sin(steep) - sin(l.r))
          fx.current.push(els[b.i].animate([
            { offset: 0, transform: turn(0, dy), opacity: 1, easing: DROP },
            { offset: 0.26, transform: turn(l.tx / 2, dy + (l.ty - lift - dy) / 4, spin), opacity: 1, easing: DROP_ON },
            { offset: 0.52, transform: turn(l.tx, l.ty - lift, steep), opacity: 1, easing: DROP },
            { offset: 0.66, transform: turn(l.tx, l.ty, l.r - s * 3, 1.02, 0.92), opacity: 1, easing: RISE },
            { offset: 0.8, transform: turn(l.tx, l.ty - 4, l.r + s * 1.5), opacity: 1, easing: DROP },
            { offset: 0.9, transform: turn(l.tx, l.ty, l.r - s / 2), opacity: 1, easing: EASE },
            { offset: 1, transform: at(l), opacity: 1 },
          ], { duration: ms(450), delay: ms(k * gap), fill: 'both' }))
        })
      }
    } else {
      stop(loop.current)
      stop(fx.current)
      lying.current = []
    }
    return () => box.classList.remove(styles.draining)
  }, [state, notStarted])

  const caption = state !== 'failed' ? 'Bob is putting your Blocks together…'
    : notStarted ? "Bob didn't get to start." : 'Bob will stack them again when you try again.'
  return (
    <div ref={stage} className={cx(styles.stage, styles[`stage-${state}`])} aria-hidden>
      <span className={styles.caption}>{caption}</span>
      <div className={styles.base} ref={base}>
        {BRICKS.map(({ bottom, left, width, cat }, i) => (
          <span key={i} className={cx(`cat-${cat}`, styles.brick)} style={{ left, bottom, width, height: ROW - 2 }} />
        ))}
      </div>
      <img ref={bob} className={styles.bob} src="/bob.svg" alt="" />
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
  const notStarted = failed && (run.reason === 'limit' || run.reason === 'start')
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
          {failed && <><span className={cx(styles.bang, styles.bigBang)}>!</span>{run.n ? `Build ${run.n}` : 'Your Build'} {notStarted ? 'did not start' : 'did not finish'}</>}
        </h2>
        {run.state === 'done' && <p className={styles.sub}>Opening your website…</p>}
        {failed && <p className={styles.sub}>Nothing changed: your code and Blocks are as they were.</p>}
      </div>
      <BuildStage state={run.state} notStarted={notStarted} />
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
