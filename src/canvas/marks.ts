import type { Warning } from '../instructions/warnings.ts'

export function marksOf(ws: Warning[]): Map<string, Warning[]> {
  const marks = new Map<string, Warning[]>()
  for (const w of ws) if (w.target) marks.set(w.target, [...(marks.get(w.target) ?? []), w])
  return marks
}

export const badgeOf = (ws: Warning[]) => ws[0]?.kind === 'look' ? '?' : '!'

export function stopsOf(ws: Warning[]): Warning[] {
  const keys = new Set<string>()
  return ws.filter(w => w.target && !keys.has(w.key) && keys.add(w.key))
}
