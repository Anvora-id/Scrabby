import { useEffect, useId, useRef } from 'react'
import type { Icon } from '@phosphor-icons/react'
import styles from './Warning.module.css'

interface WarningProps {
  icon: Icon
  title: string
  lines: string[]
  confirm: string
  danger?: boolean
  extra?: { label: string; onClick: () => void }
  onCancel: () => void
  onConfirm: () => void
}

/** Every modal in the app: a native `<dialog>` in the middle of the screen; Escape cancels. */
export function Warning({ icon: Icon, title, lines, confirm, danger, extra, onCancel, onConfirm }: WarningProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const go = useRef<HTMLButtonElement>(null)
  const id = useId()
  // showModal focuses the first button; the confirm button is the one that starts focused.
  useEffect(() => {
    ref.current?.showModal()
    go.current?.focus()
  }, [])
  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={id} onClose={onCancel}>
      <h2 id={id} className={styles.head}><Icon size={24} weight="fill" aria-hidden />{title}</h2>
      <div className={styles.body}>
        {lines.map(l => <p key={l}>{l}</p>)}
        <div className={styles.buttons}>
          {extra && <button className={styles.secondary} onClick={extra.onClick}>{extra.label}</button>}
          <button className={styles.secondary} onClick={onCancel}>Cancel</button>
          <button ref={go} className={danger ? styles.danger : styles.primary} onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </dialog>
  )
}
