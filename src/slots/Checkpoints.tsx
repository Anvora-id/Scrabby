import { useEffect, useRef } from 'react'
import { Slot } from './Slot.tsx'
import styles from './Checkpoints.module.css'

export default function Checkpoints() { return <Slot name="Checkpoints" issue={14} /> }

interface WarningProps { title: string; lines: string[]; confirm: string; onCancel: () => void; onConfirm: () => void }

export function Warning({ title, lines, confirm, onCancel, onConfirm }: WarningProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return (
    <dialog ref={ref} className={styles.dialog} onClose={onCancel}>
      <h2>{title}</h2>
      <div className={styles.body}>
        {lines.map(l => <p key={l}>{l}</p>)}
        <div className={styles.buttons}>
          <button className={styles.text} onClick={onCancel}>Cancel</button>
          <button className={styles.primary} onClick={onConfirm} autoFocus>{confirm}</button>
        </div>
      </div>
    </dialog>
  )
}
