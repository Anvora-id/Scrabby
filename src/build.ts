import type { Category } from './model/catalogue.ts'
import { createStore } from './store.ts'

export type FailReason = 'time' | 'turns' | 'unreachable' | 'broken'
export const FAILURE_LINES: Record<FailReason, string> = {
  time: 'Bob took too long, so this Build was stopped.',
  turns: 'Bob ran out of steps before finishing, so this Build was stopped.',
  unreachable: "Bob couldn't be reached. Check your connection and try again.",
  broken: "Bob's answer came back broken, so this Build was stopped.",
}
export interface BuildRun {
  n: number; state: 'running' | 'done' | 'failed'
  chips: { id: string; name: string; category: Category }[]
  lit: string[]; loose: number; skipped: string[]; reason?: FailReason
}

const run = createStore<BuildRun | undefined>(undefined)
export const useBuild = () => run.use()
export const getBuild = () => run.get()
