import { useEffect, useLayoutEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { getProject, useProject, useUi } from '../store.ts'
import { downloadCode } from '../download.ts'
import {
  askDemo, askNewProject, askStore, closeAsk, closeTip, endTour, firstTour, greetingStore, isEmptyProject,
  loadDemo, newProject, nextBubble, once, placeBubble, replacingStore, startTour, tipStore, tourStore, TOURS,
  type Box,
} from '../onboarding.ts'
import styles from './Onboarding.module.css'

export default function Onboarding() {
  const { step } = useUi()
  const greet = greetingStore.use()

  useEffect(() => {
    if (step === 'try' && once('scrabby.tour.try')) startTour('try')
  }, [step])

  // A tour started behind the greeting (the demo's) shows once the greeting has gone.
  return (
    <>
      {greet ? <Greeting /> : <Tour />}
      <Tip />
      <ReplaceWarning />
    </>
  )
}

function Greeting() {
  const project = useProject()
  // App mounts after the saved Project has loaded, so this is the one the visit found.
  const [found] = useState(project)
  const empty = isEmptyProject(found)
  const ask = askStore.use()
  const busy = replacingStore.use()
  const [then, setThen] = useState<(() => void) | null>(null)
  const first = useRef<HTMLButtonElement>(null)
  const off = busy || then !== null

  // Close, then act: once the leave animation ends, or at once with reduced motion.
  const leave = (act: () => void) => {
    if (then) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { greetingStore.set(false); act() }
    else setThen(() => act)
  }
  const noTour = () => {}

  // The card waits for a demo or a new Project to be in place, then leaves; a failed load leaves it up.
  useEffect(() => {
    if (project !== found) leave(isEmptyProject(project) ? firstTour : noTour)
  }, [project])

  // Focus starts on the first button, and comes back to it when a warning on top closes.
  useEffect(() => {
    if (!ask) first.current?.focus()
  }, [ask])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ask && !busy) leave(empty ? firstTour : noTour)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [then, ask, busy])

  return (
    <div
      className={`${styles.backdrop} ${styles.center}`}
      inert={ask !== null}
      data-leaving={then ? '' : undefined}
      onAnimationEnd={e => {
        if (then && e.target === e.currentTarget) { greetingStore.set(false); then() }
      }}
    >
      <div className={styles.greeting} role="dialog" aria-modal="true" aria-labelledby="greeting-title">
        <div className={styles.logo}>
          <img src="/bob.svg" alt="" />
          <span id="greeting-title" className={styles.wordmark}>Scrabby</span>
        </div>
        <h1 className={styles.slogan}>Ideas are best blocked out.</h1>
        <p className={styles.pitch}>Snap your idea together. Bob builds it for real.</p>
        {empty ? (
          <div className={styles.choices}>
            <button ref={first} className={styles.demo} disabled={off} onClick={askDemo}>Take me to the Demo</button>
            <button className={styles.secondary} disabled={off} onClick={() => leave(firstTour)}>
              Start my own site
            </button>
          </div>
        ) : (
          <div className={styles.choices}>
            <button ref={first} className={styles.demo} disabled={off} onClick={() => leave(noTour)}>
              Continue “{found.name}”
            </button>
            <button className={styles.secondary} disabled={off} onClick={askDemo}>Take me to the Demo</button>
            <button className={styles.secondary} disabled={off} onClick={askNewProject}>Start a new site</button>
          </div>
        )}
      </div>
    </div>
  )
}

const ASKS = {
  demo: {
    title: 'Load the demo?',
    text: "This replaces your current Project, Blocks and all. Download code first to keep a copy of the website's code.",
    go: 'Load the demo',
    run: loadDemo,
  },
  new: {
    title: 'Start a new Project?',
    text: "Only one Project is saved, so this one will be replaced, Blocks and all. Download code first to keep a copy of the website's code.",
    go: 'Start a new Project',
    run: newProject,
  },
}

function ReplaceWarning() {
  const ask = askStore.use()

  useEffect(() => {
    if (!ask) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAsk() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ask])

  if (!ask) return null
  const a = ASKS[ask]
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ask-title">
        <h2 id="ask-title" className={styles.title}>{a.title}</h2>
        <div className={styles.body}>
          <p>{a.text}</p>
          <div className={styles.buttons}>
            <button
              className={styles.secondary}
              onClick={() => { downloadCode(getProject()).catch(e => console.error('Download code failed', e)) }}
            >
              Download code
            </button>
            <button className={styles.text} onClick={closeAsk}>Cancel</button>
            <button className={styles.primary} autoFocus onClick={() => { closeAsk(); void a.run() }}>{a.go}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tour() {
  const tour = tourStore.use()
  if (!tour) return null
  const steps = TOURS[tour.which]
  const last = tour.i === steps.length - 1
  const s = steps[tour.i]
  return (
    <SpeechBubble key={`${tour.which}${tour.i}`} target={`[data-tour="${s.target}"]`} text={s.text} clearOfBlocks>
      <span className={styles.count}>{tour.i + 1} of {steps.length}</span>
      <button className={styles.text} onClick={endTour}>Skip</button>
      <button className={styles.primary} autoFocus onClick={nextBubble}>{last ? 'Got it' : 'Next'}</button>
    </SpeechBubble>
  )
}

function Tip() {
  const id = tipStore.use()
  const tour = tourStore.use()
  if (!id || tour) return null
  return (
    <SpeechBubble target={`[data-bid="${id}"]`} text="Right-click a Block or Trait for more.">
      <button className={styles.primary} autoFocus onClick={closeTip}>Got it</button>
    </SpeechBubble>
  )
}

// A tour target can be a plain wrapper filled by the rounded panel it shows (the palette, the Canvas).
function radiusOf(el: Element): string {
  const r = getComputedStyle(el).borderRadius
  const c = el.firstElementChild
  if (r !== '0px' || !c) return r
  const a = el.getBoundingClientRect()
  const b = c.getBoundingClientRect()
  return Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1 ? radiusOf(c) : r
}

// The Blocks on the Canvas, cut to the part of the Canvas that shows them.
function canvasBlocks(): Box[] {
  const c = document.querySelector('[data-tour="canvas"]')?.getBoundingClientRect()
  if (!c) return []
  return [...document.querySelectorAll('[data-tour="canvas"] [data-bid]')]
    .map(e => {
      const b = e.getBoundingClientRect()
      return {
        left: Math.max(b.left, c.left), top: Math.max(b.top, c.top),
        right: Math.min(b.right, c.right), bottom: Math.min(b.bottom, c.bottom),
      }
    })
    .filter(b => b.right > b.left && b.bottom > b.top)
}

function SpeechBubble({ target, text, clearOfBlocks, children }: {
  target: string; text: string; clearOfBlocks?: boolean; children: ReactNode
}) {
  useUi() // re-place on a Step or tab change
  const [, replace] = useReducer((n: number) => n + 1, 0)
  const ring = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.addEventListener('resize', replace)
    return () => window.removeEventListener('resize', replace)
  }, [])

  // Positions go straight onto the DOM after every render; state here would loop.
  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(target)
    const b = bubble.current!
    const g = ring.current!
    b.hidden = g.hidden = !el
    if (!el) return
    const r = el.getBoundingClientRect()
    Object.assign(g.style, {
      left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
      borderRadius: radiusOf(el),
    })
    const avoid = clearOfBlocks ? canvasBlocks() : []
    const p = placeBubble(r, b.offsetWidth, b.offsetHeight, window.innerWidth, window.innerHeight, avoid)
    b.style.left = `${p.x}px`
    b.style.top = `${p.y}px`
    b.style.setProperty('--tail', `${p.tail}px`)
    b.dataset.side = p.side
  })

  return (
    <>
      <div ref={ring} className={styles.ring} hidden />
      <div ref={bubble} className={styles.bubble} role="dialog" aria-label="Tip" hidden>
        <span className={styles.tail} />
        <img src="/bob.svg" alt="" className={styles.bob} />
        {text}
        <div className={styles.footer}>{children}</div>
      </div>
    </>
  )
}
