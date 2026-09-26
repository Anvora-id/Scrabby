import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ICONS } from '../icons.ts'
import { useUi, setPlanTab, type PlanTab } from '../store.ts'
import Canvas from '../slots/Canvas.tsx'
import Palette from '../slots/Palette.tsx'
import Library from '../slots/Library.tsx'
import Checkpoints from '../slots/Checkpoints.tsx'
import BuildButton from '../slots/BuildButton.tsx'
import BuildCard from '../slots/BuildCard.tsx'
import Preview from '../slots/Preview.tsx'
import CodeEditor from '../slots/CodeEditor.tsx'
import Assistant from '../slots/Assistant.tsx'
import styles from './Steps.module.css'

const TABS: { id: PlanTab; label: string; iconKey: keyof typeof ICONS }[] = [
  { id: 'canvas',      label: 'Canvas',      iconKey: 'tab_canvas' },
  { id: 'library',     label: 'Library',     iconKey: 'tab_library' },
  { id: 'checkpoints', label: 'Checkpoints', iconKey: 'tab_checkpoints' },
]

function PlanStep() {
  const ui = useUi()

  return (
    <div className={styles.planStep}>
      {/* Tab row */}
      <div className={styles.tabRow} role="tablist">
        {TABS.map((tab, i) => {
          const selected = tab.id === ui.planTab
          const Icon = ICONS[tab.iconKey]
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              className={styles.tab}
              style={{ zIndex: selected ? 3 : 2 - i }}
              onClick={() => setPlanTab(tab.id)}
            >
              <Icon weight="fill" size={20} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab panel */}
      <div className={styles.planPanel}>
        {ui.planTab === 'canvas' && (
          <div className={styles.canvasPanel}>
            <div className={styles.paletteArea} data-tour="palette">
              <Palette />
            </div>
            <div className={styles.canvasArea} data-tour="canvas">
              <Canvas />
              <div className={styles.buildButtonHolder}>
                <BuildButton />
              </div>
            </div>
          </div>
        )}
        {ui.planTab === 'library' && <Library />}
        {ui.planTab === 'checkpoints' && <Checkpoints />}
      </div>
    </div>
  )
}

function BuildStep() {
  return (
    <div className={styles.buildStep}>
      <div className={styles.buildHolder}>
        <BuildCard />
      </div>
    </div>
  )
}

const COLS_KEY = 'scrabby.tryCols'
type Cols = { code: number; assistant: number }

function loadCols(): Cols | null {
  try {
    const c = JSON.parse(localStorage.getItem(COLS_KEY) ?? 'null')
    return typeof c?.code === 'number' && typeof c?.assistant === 'number' ? c : null
  } catch {
    return null
  }
}

function saveCols(c: Cols | null) {
  try {
    if (c) localStorage.setItem(COLS_KEY, JSON.stringify(c))
    else localStorage.removeItem(COLS_KEY)
  } catch { /* no storage: defaults next time */ }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// Handle 0 sits between Preview and Code, handle 1 between Code and Assistant; w = the three panels' widths.
function resize(handle: number, [p, c, a]: number[], dx: number): Cols {
  if (handle === 0) return { code: clamp(c - dx, 320, p + c - 320), assistant: a }
  const code = clamp(c + dx, 320, c + a - 260)
  return { code, assistant: c + a - code }
}

function TryStep() {
  const [cols, setCols] = useState(loadCols)
  const [dragging, setDragging] = useState(false)
  const grid = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; handle: number; w: number[] } | null>(null)

  useEffect(() => { if (!dragging) saveCols(cols) }, [cols, dragging])

  // Panels are the grid's children 0, 2 and 4; the handles sit between them.
  const widths = () => [0, 2, 4].map(i => grid.current!.children[i].getBoundingClientRect().width)

  function endDrag() {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    document.body.classList.remove(styles.noSelect)
  }

  function handle(i: number) {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        title="Drag to resize, double-click to reset"
        className={styles.handle}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, handle: i, w: widths() }
          setDragging(true)
          document.body.classList.add(styles.noSelect)
        }}
        onPointerMove={e => {
          const d = drag.current
          if (d) setCols(resize(d.handle, d.w, e.clientX - d.x))
        }}
        onPointerUp={endDrag}
        onLostPointerCapture={endDrag}
        onDoubleClick={() => setCols(null)}
        onKeyDown={(e: KeyboardEvent) => {
          const dx = e.key === 'ArrowLeft' ? -16 : e.key === 'ArrowRight' ? 16 : 0
          if (!dx) return
          e.preventDefault()
          setCols(resize(i, widths(), dx))
        }}
      />
    )
  }

  // ponytail: widths are clamped only while resizing, not when the window shrinks later
  return (
    <div
      ref={grid}
      className={dragging ? `${styles.tryStep} ${styles.dragging}` : styles.tryStep}
      style={cols ? { gridTemplateColumns: `minmax(0,1fr) 8px ${cols.code}px 8px ${cols.assistant}px` } : undefined}
    >
      <div className={styles.tryPanel} data-tour="preview">
        <Preview />
      </div>
      {handle(0)}
      <div className={styles.tryPanel}>
        <CodeEditor />
      </div>
      {handle(1)}
      <div className={styles.tryPanel} data-tour="assistant">
        <Assistant />
      </div>
    </div>
  )
}

export default function Steps() {
  const ui = useUi()
  return (
    <div className={styles.steps}>
      {ui.step === 'plan'  && <PlanStep />}
      {ui.step === 'build' && <BuildStep />}
      {ui.step === 'try'   && <TryStep />}
    </div>
  )
}
