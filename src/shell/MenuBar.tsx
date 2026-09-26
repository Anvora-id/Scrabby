import { useEffect } from 'react'
import { ICONS } from '../icons.ts'
import {
  useProject, useUi, getProject, updateProject,
  undo, redo, canUndo, canRedo,
} from '../store.ts'
import { NEW_NAME } from '../model/project.ts'
import { askDemo, askNewProject, startTour } from '../onboarding.ts'
import { downloadCode } from '../download.ts'
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
  const { step } = useUi()

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return
      const target = e.target as Element | null
      if (target?.closest('input, textarea, select')) return
      // Lower-case: Shift and Caps Lock give 'Z'.
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
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

      {/* Project name chip: the Site's name too (applyChange keeps them equal) */}
      <input
        className={styles.projectName}
        value={project.name}
        size={Math.min(34, Math.max(3, project.name.length + 1))}
        title="Rename your Project"
        aria-label="Project name"
        onChange={e => updateProject(d => { d.name = e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        onBlur={() => { if (!getProject().name.trim()) updateProject(d => { d.name = NEW_NAME }) }}
      />

      {/* Buttons */}
      <MenuButton iconKey="new" label="New Project" title="New Project" onClick={askNewProject} />
      <MenuButton iconKey="demo" label="Demo" title="Demo" onClick={askDemo} />
      <MenuButton
        iconKey="download"
        label="Download code"
        title="Download code"
        onClick={() => { downloadCode(project).catch(e => console.error('Download code failed', e)) }}
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
        disabled={step === 'build'}
        title="Show me around"
        onClick={() => startTour(step === 'try' ? 'try' : 'plan')}
      />
    </header>
  )
}
