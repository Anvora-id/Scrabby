import { strToU8, zipSync, type Zippable } from 'fflate'
import type { Project } from './model/types.ts'
import { getAsset } from './db.ts'

export function zipDownload(
  project: Pick<Project, 'files'>,
  assets: { file: string; data: Uint8Array }[],
): Uint8Array {
  const zip: Zippable = {}
  for (const [path, text] of Object.entries(project.files)) {
    if (!path.startsWith('.builds/')) zip[path] = strToU8(text)
  }
  // Images and videos are already compressed.
  for (const a of assets) zip[`assets/${a.file}`] = [a.data, { level: 0 }]
  return zipSync(zip)
}

export async function downloadCode(project: Project): Promise<void> {
  const assets: { file: string; data: Uint8Array }[] = []
  for (const a of project.assets) {
    const stored = await getAsset(project.id, a.id)
    if (!stored) { console.warn(`Asset ${a.file} has no saved file; left out of the download`); continue }
    assets.push({ file: a.file, data: new Uint8Array(await stored.blob.arrayBuffer()) })
  }
  const blob = new Blob([zipDownload(project, assets) as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name.replace(/[^\p{L}\p{N} _-]+/gu, '').trim() || 'my-site'}.zip`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
