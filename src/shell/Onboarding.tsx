import { useEffect, useLayoutEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { getProject, useProject, useUi } from '../store.ts'
import { downloadCode } from '../download.ts'
import { ICONS } from '../icons.ts'
import {
  askDemo, askNewProject, askStore, closeAsk, closeTip, endTour, firstTour, greetingStore, isEmptyProject, keepClearOf,
  loadDemo, newProject, nextBubble, once, placeBubble, replacingStore, shortName, startTour, tipStore, tourStore, TOURS,
  type Box,
} from '../onboarding.ts'
import { Warning } from './Warning.tsx'
import styles from './Onboarding.module.css'

export default function Onboarding() {
  const { step, planTab } = useUi()
  const greet = greetingStore.use()
  const prevStep = useRef(step)

  useEffect(() => {
    const from = prevStep.current
    prevStep.current = step
    if (step === 'try' && once('scrabby.tour.try')) startTour('try')
    if (step === 'plan' && planTab === 'checkpoints' && once('scrabby.tour.checkpoints')) startTour('checkpoints')
    // Back from Try & tweak to a built Canvas: the Blocks have gone into the Checkpoint Block.
    const built = getProject().blocks.canvas.children.some(id => getProject().blocks[id]?.type === 'checkpoint')
    if (step === 'plan' && from === 'try' && planTab === 'canvas' && built && once('scrabby.tour.built')) startTour('built')
  }, [step, planTab])

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
  const [afterLeave, setAfterLeave] = useState<(() => void) | null>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const off = busy || afterLeave !== null

  const leave = (act: () => void) => { if (!afterLeave) setAfterLeave(() => act) }
  const noTour = () => {}

  // Close, then act, once the leave animations have run. With none running (reduced motion, or
  // animations turned off some other way) that is at once, so the card can't get stuck.
  // The toy Blocks float forever, so endless animations don't count.
  useEffect(() => {
    if (!afterLeave) return
    let live = true
    const running = backdrop.current!.getAnimations({ subtree: true })
      .filter(a => a.effect?.getComputedTiming().activeDuration !== Infinity)
      .map(a => a.finished)
    void Promise.allSettled(running).then(() => {
      if (live) { greetingStore.set(false); afterLeave() }
    })
    return () => { live = false }
  }, [afterLeave])

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
  }, [afterLeave, ask, busy])

  const Demo = ICONS.demo
  const New = ICONS.new
  return (
    <div ref={backdrop} className={styles.backdrop} inert={ask !== null} data-leaving={afterLeave ? '' : undefined}>
      <div className={styles.greeting} role="dialog" aria-modal="true" aria-label="Scrabby">
        <div className={styles.stage}>
          <div className={styles.logo}>
            <img src="/bob.svg" alt="" />
            <Wordmark />
          </div>
        </div>
        <div className={styles.lower}>
          <h1 className={styles.slogan}>Build your ideas block by block.</h1>
          <p className={styles.pitch}>Snap your idea together. Bob builds it for real.</p>
          {empty ? (
            <div className={styles.bento}>
              <button ref={first} className={`${styles.big} ${styles.wide}`} disabled={off} onClick={askDemo}>
                <Demo size={24} weight="fill" />Take me to the Demo
              </button>
              <button className={`${styles.tile} ${styles.wide}`} disabled={off} onClick={() => leave(firstTour)}>
                <New size={20} weight="fill" />Start my own site
              </button>
            </div>
          ) : (
            <div className={styles.bento}>
              <button
                ref={first}
                className={`${styles.big} ${styles.wide}`}
                disabled={off}
                title={`Continue “${found.name}”`}
                aria-label={`Continue “${found.name}”`}
                onClick={() => leave(noTour)}
              >
                <ArrowRightIcon size={24} weight="bold" />
                <span className={styles.label}>Continue “{shortName(found.name)}”</span>
              </button>
              <button className={styles.tile} disabled={off} onClick={askDemo}>
                <Demo size={20} weight="fill" />Take me to the Demo
              </button>
              <button className={styles.tile} disabled={off} onClick={askNewProject}>
                <New size={20} weight="fill" />Start a new site
              </button>
            </div>
          )}
          <div className={styles.toys} aria-hidden="true">
            {TOYS.map(({ cat, icon: Icon }) => (
              <span key={cat} className={`${styles.toy} cat-${cat}`}><Icon size={14} weight="fill" /></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Each letter rises and springs back in turn, like a worm moving through the word.
function wave(word: HTMLElement, delay: number) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const letters = [...word.children]
  if (letters.some(l => l.getAnimations().length)) return // a running wave finishes first
  const spring = getComputedStyle(word).getPropertyValue('--spring').trim()
  letters.forEach((l, i) => l.animate(
    [{ transform: 'none', easing: spring }, { transform: 'translateY(-10px)', offset: 0.4, easing: spring }, { transform: 'none' }],
    { duration: 450, delay: delay + i * 60 },
  ))
}

function Wordmark() {
  const word = useRef<HTMLSpanElement>(null)
  useEffect(() => wave(word.current!, 450), []) // once, just after Bob's hop
  return (
    <span ref={word} className={styles.wordmark} onPointerEnter={() => wave(word.current!, 0)}>
      {[...'Scrabby'].map((c, i) => <span key={i}>{c}</span>)}
    </span>
  )
}

// A row of toy Blocks under the buttons, like toys left on the desk.
const TOYS = [
  { cat: 'site', icon: ICONS.site },
  { cat: 'pages', icon: ICONS.page },
  { cat: 'ui', icon: ICONS.cardgrid },
  { cat: 'design', icon: ICONS.t_color },
  { cat: 'content', icon: ICONS.image },
]

const ASKS = {
  demo: {
    icon: ICONS.demo,
    title: 'Load the demo?',
    text: "This replaces your current Project, Blocks and all. Download code first to keep a copy of the website's code.",
    go: 'Load the demo',
    run: loadDemo,
  },
  new: {
    icon: ICONS.new,
    title: 'Start a new Project?',
    text: "Only one Project is saved, so this one will be replaced, Blocks and all. Download code first to keep a copy of the website's code.",
    go: 'Start a new Project',
    run: newProject,
  },
}

function ReplaceWarning() {
  const ask = askStore.use()
  if (!ask) return null
  const a = ASKS[ask]
  return (
    <Warning
      icon={a.icon}
      title={a.title}
      lines={[a.text]}
      confirm={a.go}
      extra={{
        label: 'Download code',
        onClick: () => { downloadCode(getProject()).catch(e => console.error('Download code failed', e)) },
      }}
      onCancel={closeAsk}
      onConfirm={() => { closeAsk(); void a.run() }}
    />
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

function tourAvoid(target: Box, up: number): Box[] {
  const canvas = document.querySelector('[data-tour="canvas"]')?.getBoundingClientRect()
  if (!canvas) return []
  const blocks = [...document.querySelectorAll('[data-tour="canvas"] [data-bid]')].map(e => e.getBoundingClientRect())
  return keepClearOf(target, canvas, blocks, window.innerWidth, up)
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
    // A bottom edge drawn as a box shadow (the Build button's) is part of the target the ring fits.
    const edge = Number(/\) 0px ([\d.]+)px 0px/.exec(getComputedStyle(el).boxShadow)?.[1] ?? 0)
    const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom + edge }
    Object.assign(g.style, {
      left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height + edge}px`,
      borderRadius: radiusOf(el),
    })
    // How far Bob reaches above the bubble: offsetTop, not the drawn position, so his hop doesn't move it.
    const bob = b.querySelector<HTMLElement>(`.${styles.bob}`)
    const up = bob ? -bob.offsetTop : 0
    const avoid = clearOfBlocks ? tourAvoid(box, up) : []
    const p = placeBubble(box, b.offsetWidth, b.offsetHeight, window.innerWidth, window.innerHeight, avoid, up)
    b.style.left = `${p.x}px`
    b.style.top = `${p.y}px`
    b.style.setProperty('--tail', `${p.tail}px`)
    b.dataset.side = p.side
    // Bob stands on the top corner away from the target: the left one beside it on the left, or above or below it on the right.
    b.dataset.bob = p.side === 'left' || ((p.side === 'below' || p.side === 'above') && p.tail > b.offsetWidth / 2) ? 'left' : 'right'
    // Borders snap to whole device pixels and SVG strokes don't, so the tail copies the border it joins.
    b.style.setProperty('--edge', getComputedStyle(b).borderTopWidth)
  })

  return (
    <>
      <div ref={ring} className={styles.ring} hidden />
      <div ref={bubble} className={styles.bubble} role="dialog" aria-label="Tip" hidden>
        <Tail />
        <img src="/bob.svg" alt="" className={styles.bob} />
        {text}
        <div className={styles.footer}>{children}</div>
      </div>
    </>
  )
}

// The point of a speech bubble, set by the side of the nearest [data-side] (none: the bubble is above
// its target). The SVG's box cuts off the stroke's ends, which would otherwise show inside the bubble.
export function Tail() {
  return (
    <svg className={styles.tail} viewBox="0 0 24 14" aria-hidden="true">
      <path d="M-3 -3 L12 12 L27 -3Z" stroke="none" />
      <path d="M-3 -3 L12 12 L27 -3" fill="none" />
    </svg>
  )
}
