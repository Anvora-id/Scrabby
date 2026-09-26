import { useEffect, useState, type ReactNode } from 'react'
import { dropPending, hasPending } from '../assistant.ts'
import { buildProblem, nothingNew, runBuild, useBuild } from '../build.ts'
import { cx } from '../canvas/cx.ts'
import { ICONS } from '../icons.ts'
import { getProject, setPlanTab, useProject } from '../store.ts'
import { Warning } from './Checkpoints.tsx'
import styles from './Build.module.css'

export default function BuildButton() {
  const p = useProject()
  const running = useBuild()?.state === 'running'
  const [bubble, setBubble] = useState<ReactNode>(null)
  const [warn, setWarn] = useState(false)
  const Flag = ICONS.flag

  useEffect(() => {
    if (!bubble) return
    const close = () => setBubble(null)
    // Added after the current click, so the click that opened the bubble does not close it.
    const t = setTimeout(() => addEventListener('click', close))
    return () => { clearTimeout(t); removeEventListener('click', close) }
  }, [bubble])

  async function press() {
    const p = getProject()
    if (nothingNew(p)) {
      setBubble(<>Nothing new to build. To redo a Build, open <button className={styles.link} onClick={() => setPlanTab('checkpoints')}>Checkpoints</button></>)
      return
    }
    const problem = buildProblem(p)
    if (problem) {
      setBubble(problem)
      return
    }
    if (hasPending(p)) setWarn(true)
    else await build()
  }

  async function build() {
    const limit = await runBuild().catch(e => console.error('The Build failed to run', e))
    if (limit) setBubble(limit)
  }

  return (
    <span className={styles.holder}>
      {bubble && <span className={styles.bubble} role="status">{bubble}</span>}
      <button
        className={cx(styles.button, nothingNew(p) && styles.greyed, !!bubble && styles.target)}
        disabled={running}
        data-tour="build"
        onClick={press}
      >
        <Flag weight="fill" size={24} />
        {running ? 'Building…' : 'Build'}
      </button>
      {warn && (
        <Warning
          title="Build now?"
          lines={["The Assistant has changes you haven't accepted. Building drops them."]}
          confirm="Build anyway"
          onCancel={() => setWarn(false)}
          onConfirm={() => { setWarn(false); dropPending(); build() }}
        />
      )}
    </span>
  )
}
