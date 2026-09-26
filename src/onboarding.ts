import { clearAll, putAsset } from './db.ts'
import { clearHistory, createStore, getProject, setEditing, setPlanTab, setProject, setStep } from './store.ts'
import { DEMO_PHOTOS, demoProject } from './fixtures/fixtures.ts'
import { emptyProject } from './model/project.ts'

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
    assetEntry.bytes = blob.size
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

export async function loadDemo(): Promise<void> {
  try { await replaceProject(demoProject()) } catch (e) { console.error('Loading the demo failed', e); return }
  once('scrabby.tour.plan') // seen now, so a later first-visit check doesn't repeat it
  startTour('plan')
}

export async function newProject(): Promise<void> {
  try { await replaceProject(emptyProject()) } catch (e) { console.error('Starting a new Project failed', e) }
}

// ── replace warnings ──────────────────────────────────────────────────────────

export const askStore = createStore<'demo' | 'new' | null>(null)

export function askDemo(): void {
  if (isEmptyProject(getProject())) void loadDemo()
  else askStore.set('demo')
}
export function askNewProject(): void { askStore.set('new') }
export function closeAsk(): void { askStore.set(null) }

// ── tours and the tip ─────────────────────────────────────────────────────────

export type TourName = 'plan' | 'try'

export const TOURS: Record<TourName, { target: string; text: string }[]> = {
  plan: [
    { target: 'palette', text: 'These are your Blocks and Traits. Drag one onto the Canvas to use it.' },
    { target: 'canvas', text: "This is your plan. Put Blocks inside Blocks, and drop a Trait into the Block it describes. Where things sit doesn't matter." },
    { target: 'build', text: 'When your plan is ready, press Build. Bob turns it into a real website.' },
    { target: 'steps', text: 'You move through three steps: Plan, Build, Try & tweak. You can come back to Plan any time.' },
  ],
  try: [
    { target: 'preview', text: 'This is your website. Click around: links, buttons and forms work.' },
    { target: 'assistant', text: 'Ask Bob about the code, or ask for a change. You decide whether to keep each change.' },
  ],
}

export const tourStore = createStore<{ which: TourName; i: number } | null>(null)

export function startTour(which: TourName): void {
  if (which === 'plan') setPlanTab('canvas')
  tourStore.set({ which, i: 0 })
}
export function nextBubble(): void {
  const t = tourStore.get()
  if (!t) return
  if (t.i + 1 < TOURS[t.which].length) tourStore.set({ ...t, i: t.i + 1 })
  else endTour()
}
export function endTour(): void { tourStore.set(null) }
/** The Plan show-around on this browser's first visit. */
export function firstTour(): void {
  if (once('scrabby.tour.plan')) startTour('plan')
}

/** True the first time for this key; true every time when storage throws. */
export function once(key: string): boolean {
  try {
    if (localStorage.getItem(key)) return false
    localStorage.setItem(key, '1')
    return true
  } catch {
    return true
  }
}

export const tipStore = createStore<string | null>(null)

export function droppedBlock(id: string): void {
  if (!tourStore.get() && once('scrabby.tip.rightClick')) tipStore.set(id)
}
export function closeTip(): void { tipStore.set(null) }

// ── bubble placement ──────────────────────────────────────────────────────────

export interface Placement { side: 'right' | 'left' | 'below' | 'above' | 'inside'; x: number; y: number; tail: number }

const GAP = 14
const EDGE = 8
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

export function placeBubble(
  r: { left: number; top: number; right: number; bottom: number },
  w: number, h: number, W: number, H: number,
): Placement {
  const cx = (r.left + r.right) / 2
  const cy = (r.top + r.bottom) / 2
  const x = clamp(cx - w / 2, EDGE, W - EDGE - w)
  const y = clamp(cy - h / 2, EDGE, H - EDGE - h)
  const along = (c: number, from: number, size: number) => clamp(c - from, 20, size - 20)
  const inside: Placement = { side: 'inside', x, y: r.top + 24, tail: 0 }
  if (r.right - r.left > W / 2 && r.bottom - r.top > H / 2) return inside
  if (r.right + GAP + w <= W - EDGE) return { side: 'right', x: r.right + GAP, y, tail: along(cy, y, h) }
  if (r.left - GAP - w >= EDGE) return { side: 'left', x: r.left - GAP - w, y, tail: along(cy, y, h) }
  if (r.bottom + GAP + h <= H - EDGE) return { side: 'below', x, y: r.bottom + GAP, tail: along(cx, x, w) }
  if (r.top - GAP - h >= EDGE) return { side: 'above', x, y: r.top - GAP - h, tail: along(cx, x, w) }
  return inside
}
