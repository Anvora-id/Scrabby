import { createStore, getProject, setPlanTab, setStep } from '../store.ts'
import { findBlockCode } from './code.ts'

// ── editor UI ─────────────────────────────────────────────────────────────────

interface EditorUi { file?: string; jump?: { file: string; line: number }; review?: number }

const editorUi = createStore<EditorUi>({})

export const useEditorUi = () => editorUi.use()
export const getEditorUi = () => editorUi.get()

export function openFile(file: string): void {
  editorUi.set({ ...editorUi.get(), file })
}

export function clearJump(): void {
  editorUi.set({ ...editorUi.get(), jump: undefined })
}

export function startReview(time: number, file: string): void {
  editorUi.set({ file, review: time })
}

// The mounted editor replaces `read`.
export const editorSelection: { read: () => string | null } = { read: () => null }

export function seeItsCode(id: string): boolean {
  const found = findBlockCode(getProject().files, id)
  if (!found) return false
  editorUi.set({ file: found.file, jump: found })
  setStep('try')
  return true
}

// ── Checkpoint focus ──────────────────────────────────────────────────────────

const checkpointFocus = createStore<string | undefined>(undefined)

export const useCheckpointFocus = () => checkpointFocus.use()

export function clearCheckpointFocus(): void {
  checkpointFocus.set(undefined)
}

export function openCheckpointsAtBlock(id: string): void {
  checkpointFocus.set(id)
  setStep('plan')
  setPlanTab('checkpoints')
}
