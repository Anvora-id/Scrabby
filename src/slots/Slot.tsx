import styles from './slot.module.css'

interface Props { name: string; issue: number }
export function Slot({ name, issue }: Props) {
  return <div className={styles.slot}>{name} <span className={styles.issue}>issue {issue}</span></div>
}
