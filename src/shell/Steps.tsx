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

function TryStep() {
  return (
    <div className={styles.tryStep}>
      <div className={styles.tryPanel} data-tour="preview">
        <Preview />
      </div>
      <div className={styles.tryPanel}>
        <CodeEditor />
      </div>
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
