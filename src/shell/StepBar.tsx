import { Fragment } from 'react'
import { ICONS } from '../icons.ts'
import { useUi, setStep, type Step } from '../store.ts'
import styles from './StepBar.module.css'

const STEPS: { id: Step; label: string; n: number }[] = [
  { id: 'plan',  label: 'Plan',         n: 1 },
  { id: 'build', label: 'Build',        n: 2 },
  { id: 'try',   label: 'Try & tweak',  n: 3 },
]

export default function StepBar() {
  const ui = useUi()
  const currentIdx = STEPS.findIndex(s => s.id === ui.step)
  const building = ui.step === 'build'

  return (
    <nav className={styles.stepBar} data-tour="steps">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx
        const isCurrent = i === currentIdx
        const state: 'current' | 'done' | 'idle' = isCurrent ? 'current' : isDone ? 'done' : 'idle'
        const disabled = step.id === 'build' || building
        const CheckIcon = ICONS.check
        return (
          <Fragment key={step.id}>
          {i > 0 && <span className={styles.sep}>›</span>}
          <button
            className={styles.step}
            data-state={state}
            disabled={disabled}
            onClick={() => setStep(step.id)}
          >
            <span className={styles.circle}>
              {isDone ? <CheckIcon weight="fill" size={13} /> : step.n}
            </span>
            {step.label}
          </button>
          </Fragment>
        )
      })}
      {ui.step === 'try' && (
        <button
          className={`${styles.back} ${styles.ghost}`}
          data-tour="back"
          onClick={() => setStep('plan')}
        >
          ← Back to the Blocks
        </button>
      )}
    </nav>
  )
}
