import { useSyncExternalStore } from 'react'
import { applyChange, emptyProject } from './model/project.ts'
import type { Project } from './model/types.ts'
import { createHistory } from './history.ts'
import { loadLatestProject, saveProject } from './db.ts'

export type Step = 'plan' | 'build' | 'try'
export type PlanTab = 'canvas' | 'library' | 'checkpoints'

// ── generic store ─────────────────────────────────────────────────────────────

interface Store<T> {
  get(): T
  set(v: T): void
  use(): T
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial
  const listeners = new Set<() => void>()

  return {
    get() { return value },
    set(v: T) {
      value = v
      listeners.forEach(l => l())
    },
    use() {
      return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
        () => value,
      )
    },
  }
}

// ── history ───────────────────────────────────────────────────────────────────

const history = createHistory<Project>()

export const canUndo = () => history.canUndo()
export const canRedo = () => history.canRedo()
export const clearHistory = () => history.clear()

// ── project store ─────────────────────────────────────────────────────────────

const projectStore = createStore<Project>(emptyProject())

export const getProject = () => projectStore.get()
export const useProject = () => projectStore.use()

export function setProject(p: Project): void {
  projectStore.set(p)
  saveProject(p).catch(e => console.error('Saving the Project failed', e))
}

export function updateProject(recipe: (p: Project) => void, key: unknown = focusedField()): void {
  const before = getProject()
  updateProjectWithoutUndo(recipe)
  history.record(before, key)
}

export function updateProjectWithoutUndo(recipe: (p: Project) => void): void {
  setProject({ ...applyChange(getProject(), recipe), updated: Date.now() })
}

export function undo(): void {
  const p = history.undo(getProject())
  if (p) setProject({ ...p, chat: getProject().chat })
}

export function redo(): void {
  const p = history.redo(getProject())
  if (p) setProject({ ...p, chat: getProject().chat })
}

export async function startStore(): Promise<void> {
  // Not awaited: the browser may wait on a permission prompt; a refusal changes nothing here.
  navigator.storage?.persist?.().catch(() => {})
  let saved: Project | undefined
  try {
    saved = await loadLatestProject()
  } catch (e) {
    console.error('Loading the Project failed', e)
  }
  if (saved) {
    projectStore.set(saved)
  } else {
    setProject(projectStore.get())
  }
}

function focusedField(): Element | null {
  if (typeof globalThis.document === 'undefined') return null
  return document.activeElement?.closest('input, textarea') ?? null
}

// ── UI store ──────────────────────────────────────────────────────────────────

interface UiState {
  step: Step
  planTab: PlanTab
  editing: string | null
}

const uiStore = createStore<UiState>({ step: 'plan', planTab: 'canvas', editing: null })

export const getUi = () => uiStore.get()
export const useUi = () => uiStore.use()

export function setStep(step: Step): void {
  uiStore.set({ ...uiStore.get(), step })
}

export function setPlanTab(planTab: PlanTab): void {
  uiStore.set({ ...uiStore.get(), planTab })
}

export function setEditing(editing: string | null): void {
  uiStore.set({ ...uiStore.get(), editing })
}
