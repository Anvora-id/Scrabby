import { useEffect } from 'react'
import { ICONS } from '../icons.ts'
import {
  useProject,
  undo, redo, canUndo, canRedo,
} from '../store.ts'
import { FIXTURES, loadFixture } from '../fixtures/dev.ts'
import styles from './MenuBar.module.css'

function MenuButton({
  iconKey,
  label,
  disabled,
  title,
  onClick,
}: {
  iconKey: keyof typeof ICONS
  label: string
  disabled?: boolean
  title?: string
  onClick?: () => void
}) {
  const Icon = ICONS[iconKey]
  return (
    <button
      className={styles.menuBtn}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <Icon weight="fill" size={16} />
      {label}
    </button>
  )
}

export default function MenuBar() {
  const project = useProject()

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return
      const target = e.target as Element | null
      if (target?.closest('input, textarea, select')) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleFixture(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value
    e.target.value = ''
    if (name) void loadFixture(name)
  }

  return (
    <header className={styles.menuBar}>
      {/* Logo */}
      <img src="/bob.svg" alt="" className={styles.logo} />
      <span className={styles.wordmark}>Scrabby</span>
      <div style={{ width: 10 }} />

      {/* Project name chip */}
      <span className={styles.projectName}>{project.name}</span>

      {/* Buttons */}
      <MenuButton iconKey="new" label="New Project" disabled title="New Project" />
      <MenuButton iconKey="demo" label="Demo" disabled title="Demo" />
      <MenuButton
        iconKey="download"
        label="Download code"
        disabled
        title="Download code"
      />
      <MenuButton
        iconKey="undo"
        label="Undo"
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
        onClick={undo}
      />
      <MenuButton
        iconKey="redo"
        label="Redo"
        disabled={!canRedo()}
        title="Redo (Ctrl+Y)"
        onClick={redo}
      />

      {/* Dev-only fixture select */}
      {import.meta.env.DEV && (
        <select
          className={styles.devSelect}
          value=""
          title="Dev only: replace the current Project with a fixture"
          onChange={handleFixture}
        >
          <option value="" disabled>Dev: load fixture…</option>
          {Object.entries(FIXTURES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      )}

      {/* Show me around — right-aligned */}
      <MenuButton
        iconKey="help"
        label="Show me around"
        disabled
        title="Show me around"
      />
    </header>
  )
}
