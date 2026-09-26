// ponytail: whole-project copies for every undo step
export interface History<T> {
  record(before: T, key?: string | null): void
  undo(current: T): T | undefined
  redo(current: T): T | undefined
  clear(): void
  canUndo(): boolean
  canRedo(): boolean
}

export function createHistory<T>(limit = 100): History<T> {
  const past: T[] = []
  const future: T[] = []
  let lastKey: string | null = null

  return {
    record(before: T, key: string | null = null): void {
      future.splice(0)
      if (key != null && key === lastKey) return // merge into open step
      lastKey = key
      past.push(before)
      if (past.length > limit) past.shift()
    },
    undo(current: T): T | undefined {
      lastKey = null
      if (past.length === 0) return undefined
      future.push(current)
      return past.pop()!
    },
    redo(current: T): T | undefined {
      lastKey = null
      if (future.length === 0) return undefined
      past.push(current)
      return future.pop()!
    },
    clear(): void {
      past.splice(0)
      future.splice(0)
      lastKey = null
    },
    canUndo(): boolean {
      return past.length > 0
    },
    canRedo(): boolean {
      return future.length > 0
    },
  }
}
