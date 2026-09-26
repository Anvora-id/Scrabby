import type { TraitType } from '../model/types.ts'
import type { Project } from '../model/types.ts'

export type BobPicksControl = 'bulb' | 'option' | null

export function bobPicksControl(type: TraitType, value: string): BobPicksControl {
  if (type === 'tellbob' || type === 'letbobpick') return null
  if (type === 'color') return 'bulb'
  const tt = type as TraitType
  // text kinds: text, fakedata
  if (tt === 'text' || tt === 'fakedata') {
    return value.trim() === '' ? 'bulb' : null
  }
  return 'option'
}

export function setBobPicks(p: Project, id: string, on: boolean): void {
  const t = p.traits[id]
  if (!t) return
  if (on) {
    t.bobPicks = true
  } else {
    delete t.bobPicks
  }
}
