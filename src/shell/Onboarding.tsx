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
          <Toys />
          <div className={styles.logo}>
            <img src="/bob.svg" alt="" />
            <Wordmark />
          </div>
        </div>
        <div className={styles.lower}>
          <h1 className={styles.slogan}>Ideas are best blocked out.</h1>
          <p className={styles.pitch}>Snap your idea together. Bob builds it for real.</p>
          {empty ? (
            <div className={styles.bento}>
              <button ref={first} className={styles.big} disabled={off} onClick={askDemo}>
                <Demo size={24} weight="fill" />Take me to the Demo
              </button>
              <button className={styles.tile} disabled={off} onClick={() => leave(firstTour)}>
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

// Toy Blocks on the paper stage. Pinned in place, each turns in 3D to face the pointer.
const TOYS = [
  { cat: 'site', icon: ICONS.site },
  { cat: 'pages', icon: ICONS.page },
  { cat: 'ui', icon: ICONS.cardgrid },
  { cat: 'design', icon: ICONS.t_color },
  { cat: 'content', icon: ICONS.image },
]

const TILT = 12 // degrees at most
const FAR = 400 // px between a toy and the pointer at which its tilt is full
// Springs on each angle: a damped one while it follows the pointer, a loose one (it wobbles) on the way home.
const FOLLOW = { k: 120, c: 20 }
const HOME = { k: 160, c: 7 }

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

// They face the pointer anywhere on the page and hold while it rests; they spring back flat when it
// leaves the window. The float (CSS, on `translate`) runs underneath, so the tilt goes on `transform`.
function Toys() {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const toys = [...box.current!.children] as HTMLElement[]
    const s = toys.map(() => ({ x: 0, vx: 0, tx: 0, y: 0, vy: 0, ty: 0 })) // rotateX and rotateY: angle, speed, target
    let spring = FOLLOW
    let frame = 0
    let last = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      let moving = false
      s.forEach((a, i) => {
        a.vx += (spring.k * (a.tx - a.x) - spring.c * a.vx) * dt
        a.vy += (spring.k * (a.ty - a.y) - spring.c * a.vy) * dt
        a.x += a.vx * dt
        a.y += a.vy * dt
        if (Math.abs(a.tx - a.x) + Math.abs(a.ty - a.y) + Math.abs(a.vx) + Math.abs(a.vy) > 0.01) moving = true
        toys[i].style.transform = `perspective(200px) rotateX(${a.x}deg) rotateY(${a.y}deg)`
      })
      frame = moving ? requestAnimationFrame(tick) : 0
    }
    const run = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    // rotateY > 0 turns the face right and rotateX > 0 turns it up, so each face points at the pointer.
    const face = (e: PointerEvent) => {
      const b = box.current!.getBoundingClientRect()
      toys.forEach((t, i) => {
        s[i].tx = -TILT * clamp((e.clientY - (b.top + t.offsetTop + t.offsetHeight / 2)) / FAR)
        s[i].ty = TILT * clamp((e.clientX - (b.left + t.offsetLeft + t.offsetWidth / 2)) / FAR)
      })
      spring = FOLLOW
      run()
    }
    const out = (e: MouseEvent) => {
      if (e.relatedTarget) return
      s.forEach(a => { a.tx = a.ty = 0 })
      spring = HOME
      run()
    }
    window.addEventListener('pointermove', face)
    document.addEventListener('mouseout', out)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', face)
      document.removeEventListener('mouseout', out)
    }
  }, [])

  return (
    <div ref={box} className={styles.toys} aria-hidden="true">
      {TOYS.map(({ cat, icon: Icon }) => (
        <span key={cat} className={`${styles.toy} cat-${cat}`}><Icon size={16} weight="fill" /></span>
      ))}
    </div>
  )
}

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

// offsetTop, not the drawn position, so Bob's hop doesn't move the bubble.
function tourAvoid(target: DOMRect, bubble: HTMLElement): Box[] {
  const canvas = document.querySelector('[data-tour="canvas"]')?.getBoundingClientRect()
  if (!canvas) return []
  const blocks = [...document.querySelectorAll('[data-tour="canvas"] [data-bid]')].map(e => e.getBoundingClientRect())
  const bob = bubble.querySelector<HTMLElement>(`.${styles.bob}`)
  return keepClearOf(target, canvas, blocks, window.innerWidth, bob ? -bob.offsetTop : 0)
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
    const avoid = clearOfBlocks ? tourAvoid(r, b) : []
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
