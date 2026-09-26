import { useAgentLabel } from '../agent.ts'
import styles from './BobBadge.module.css'

export default function BobBadge() {
  const label = useAgentLabel()
  if (!label) return null
  return (
    <span className={styles.badge} title={`Bob's answers come from ${label} right now.`}>
      running on {label}
    </span>
  )
}
