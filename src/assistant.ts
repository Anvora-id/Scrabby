import type { Files, Project, Proposal } from './model/types.ts'

export type CardState = 'accepted' | 'rejected' | 'partial' | 'outOfDate' | 'reviewing' | 'open'

export function cardState(pr: Proposal, files: Files): CardState {
  if (pr.done) return pr.accepted === pr.total ? 'accepted' : pr.accepted === 0 ? 'rejected' : 'partial'
  if (Object.entries(pr.files).some(([path, f]) => files[path] !== f.base)) return 'outOfDate'
  return pr.decided > 0 ? 'reviewing' : 'open'
}

export function openFiles(pr: Proposal): string[] {
  return Object.keys(pr.files).filter(path => (pr.files[path].base ?? '') !== pr.files[path].proposed)
}

// Stub until issue 16: only the pending proposals, not a running reply.
export function hasPending(p: Project): boolean {
  return p.chat.some(m => m.proposal && !m.proposal.done)
}

export function dropPending(_line?: string): void {}

export function decide(_time: number, _path: string, _code: string, _proposed: string): void {}
