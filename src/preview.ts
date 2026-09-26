let flash: string[] = []
const redraws = new Set<() => void>()

export const previewHooks: { askBobToFix: (error: { message: string; file: string }) => void } = {
  askBobToFix: () => {},
}

export function flashBlocks(ids: string[]): void {
  flash = ids
  redraws.forEach(fn => fn())
}

export function onRedraw(fn: () => void): () => void {
  redraws.add(fn)
  return () => { redraws.delete(fn) }
}

export function takeFlash(): string[] {
  const ids = flash
  flash = []
  return ids
}
