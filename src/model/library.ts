import type { AssetKind, Project } from './types.ts'

const KINDS: Record<string, AssetKind> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
}

export const MAX_BYTES = 25 * 1024 * 1024

export function uploadKind(f: { name: string; type: string; size: number }): AssetKind | string {
  const kind = KINDS[f.type]
  if (!kind) return `${f.name} can't go in the Library: it takes png, jpg, gif and webp images, and mp4 and webm videos.`
  if (f.size > MAX_BYTES) return `${f.name} is ${formatBytes(f.size)}. The Library takes files up to 25 MB.`
  return kind
}

export function formatBytes(n: number): string {
  let v: number
  let unit: string
  if (n < 1024 * 1024) {
    v = n / 1024; unit = 'KB'
  } else if (n < 1024 * 1024 * 1024) {
    v = n / (1024 * 1024); unit = 'MB'
  } else {
    v = n / (1024 * 1024 * 1024); unit = 'GB'
  }
  const formatted = v < 10 ? String(+v.toFixed(1)) : String(Math.round(v))
  return `${formatted} ${unit}`
}

export function cleanFileName(name: string): string {
  let s = name.normalize('NFD').toLowerCase().trim()
  s = s.replace(/\s+/g, '-')
  s = s.replace(/[^a-z0-9._-]/g, '')
  if (!s || s.startsWith('.')) s = 'file' + s
  return s
}

function freeName(existing: Set<string>, name: string): string {
  if (!existing.has(name)) return name
  const dotIdx = name.lastIndexOf('.')
  const base = dotIdx >= 0 ? name.slice(0, dotIdx) : name
  const ext = dotIdx >= 0 ? name.slice(dotIdx) : ''
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}${ext}`
    if (!existing.has(candidate)) return candidate
  }
}

export function addAsset(
  p: Project,
  uploadName: string,
  info: { kind: AssetKind; mime: string; bytes: number; width?: number; height?: number; seconds?: number },
): string {
  const id = `a${p.next.a++}`
  const existing = new Set(p.assets.map(a => a.file))
  const file = freeName(existing, cleanFileName(uploadName))
  p.assets.push({ id, file, ...info })
  return id
}

export function renamedFile(p: Project, id: string, typed: string): string {
  let name = cleanFileName(typed)
  const asset = p.assets.find(a => a.id === id)!
  if (!/\.[a-z0-9]+$/.test(name)) {
    const oldExt = asset.file.match(/\.[a-z0-9]+$/)?.[0] ?? ''
    name += oldExt
  }
  return name
}

export function renameProblem(p: Project, id: string, typed: string): string | null {
  const file = renamedFile(p, id, typed)
  if (p.assets.some(a => a.id !== id && a.file === file)) {
    return `${file} is already in the Library`
  }
  return null
}

export function renameAsset(p: Project, id: string, typed: string): void {
  const asset = p.assets.find(a => a.id === id)!
  asset.file = renamedFile(p, id, typed)
}

export function removeAsset(p: Project, id: string): void {
  p.assets = p.assets.filter(a => a.id !== id)
}

export function deleteWarning(p: Project, id: string): string {
  const asset = p.assets.find(a => a.id === id)!
  const users: string[] = []
  for (const b of Object.values(p.blocks)) {
    for (const tid of b.traits) {
      const t = p.traits[tid]
      if (t && (t.type === 'image' || t.type === 'video' || t.type === 'sound') && t.value === id) {
        users.push(`${b.name} › ${t.type}`)
      }
    }
  }
  if (users.length > 0) {
    const n = users.length
    return `Delete ${asset.file}? ${n} Trait${n > 1 ? 's' : ''} (${users.join(', ')}) and any code using it will break. You can ask the Assistant to fix the references.`
  }
  return `Delete ${asset.file}? Any code using it will break. You can ask the Assistant to fix the references.`
}
