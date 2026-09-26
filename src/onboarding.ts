import { clearAll, putAsset } from './db.ts'
import { clearHistory, setEditing, setPlanTab, setProject, setStep } from './store.ts'
import { DEMO_PHOTOS } from './fixtures/fixtures.ts'

export function isEmptyProject(p: import('./model/types.ts').Project): boolean {
  const blockCount = Object.keys(p.blocks).length
  const traitCount = Object.keys(p.traits).length
  return blockCount <= 2 && traitCount === 0 && p.assets.length === 0 && Object.keys(p.files).length === 0 && p.chat.length === 0
}

async function drawPlaceholderPhoto(label: string, color: string): Promise<Blob> {
  const canvas = new OffscreenCanvas(1200, 800)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1200, 800)
  ctx.fillStyle = '#3A2A30'
  ctx.font = 'bold 96px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 600, 430)
  return canvas.convertToBlob({ type: 'image/png' })
}

export async function replaceProject(
  project: import('./model/types.ts').Project,
  checkpoints: import('./model/types.ts').Checkpoint[] = [],
): Promise<void> {
  await clearAll()
  for (const ph of DEMO_PHOTOS) {
    const assetEntry = project.assets.find(a => a.file === ph.file)
    if (!assetEntry) continue
    const blob = await drawPlaceholderPhoto(ph.label, ph.color)
    await putAsset({ projectId: project.id, id: assetEntry.id, blob })
  }
  for (const cp of checkpoints) {
    const { addCheckpoint } = await import('./db.ts')
    await addCheckpoint({ ...cp, projectId: project.id })
  }
  clearHistory()
  setProject(project)
  setEditing(null)
  setPlanTab('canvas')
  setStep('plan')
}

// Stubs until issue 15.
export function askDemo(): void {}
export function askNewProject(): void {}
export function startTour(_which: 'plan' | 'try'): void {}
export function droppedBlock(_id: string): void {}
