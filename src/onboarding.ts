import { clearAll, putAsset } from './db.ts'
import { clearHistory, createStore, getProject, setEditing, setPlanTab, setProject, setStep } from './store.ts'
import { DEMO_PHOTOS, demoProject } from './fixtures/fixtures.ts'
import { emptyProject, NEW_NAME } from './model/project.ts'

export function isEmptyProject(p: import('./model/types.ts').Project): boolean {
  const blockCount = Object.keys(p.blocks).length
  const traitCount = Object.keys(p.traits).length
  return blockCount <= 2 && traitCount === 0 && p.assets.length === 0 && Object.keys(p.files).length === 0 && p.chat.length === 0
    && p.name === NEW_NAME
}

export async function replaceProject(
  project: import('./model/types.ts').Project,
  checkpoints: import('./model/types.ts').Checkpoint[] = [],
): Promise<void> {
  // Fetched before anything is cleared, so a failed download leaves the saved Project as it was.
  const photos = await Promise.all(project.assets.filter(a => DEMO_PHOTOS.includes(a.file)).map(async a => {
    const res = await fetch('/demo/' + a.file)
    const blob = await res.blob()
    // The dev server answers a missing file with the app's HTML page, so check it really is an image.
    if (!res.ok || !blob.type.startsWith('image/')) throw new Error(`Fetching /demo/${a.file} failed: ${res.status} ${blob.type}`)
    return { a, blob }
  }))
  await clearAll()
  for (const { a, blob } of photos) {
    a.bytes = blob.size
    await putAsset({ projectId: project.id, id: a.id, blob })
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

/** True while loadDemo or newProject runs; a second one meanwhile does nothing. */
export const replacingStore = createStore(false)

async function replaceOnce(project: import('./model/types.ts').Project, failed: string): Promise<boolean> {
  if (replacingStore.get()) return false
  replacingStore.set(true)
  try {
    await replaceProject(project)
    return true
  } catch (e) {
    console.error(failed, e)
    return false
  } finally {
    replacingStore.set(false)
  }
}

export async function loadDemo(): Promise<void> {
  if (!await replaceOnce(demoProject(), 'Loading the demo failed')) return
  once('scrabby.tour.plan') // seen now, so a later first-visit check doesn't repeat it
  startTour('plan')
}

export async function newProject(): Promise<void> {
  await replaceOnce(emptyProject(), 'Starting a new Project failed')
}

// ── greeting ──────────────────────────────────────────────────────────────────

/** The greeting shows on every page load. */
export const greetingStore = createStore(true)

/** The Project name on the greeting's Continue button: 14 characters, then "…". */
export function shortName(name: string): string {
  const chars = [...name]
  return chars.length > 14 ? `${chars.slice(0, 14).join('').trimEnd()}…` : name
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
export interface Box { left: number; top: number; right: number; bottom: number }

const GAP = 14
const EDGE = 8
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const along = (c: number, from: number, size: number) => clamp(c - from, 20, size - 20)
const nearest = (vs: number[], to: number) => vs.sort((a, b) => Math.abs(a - to) - Math.abs(b - to))[0]
const flip = (b: Box): Box => ({ left: b.top, top: b.left, right: b.bottom, bottom: b.right })

/**
 * What a tour bubble keeps clear of: the Blocks, cut to the Canvas that shows them, and for a target
 * in the Canvas panel (below the tabs) everything above the Canvas: menu bar, step bar and tabs.
 * Each box reaches `up` lower, since Bob stands on the bubble's top corner and reaches that far above it.
 */
export function keepClearOf(target: Box, canvas: Box, blocks: Box[], W: number, up: number): Box[] {
  const boxes = blocks
    .map(b => ({
      left: Math.max(b.left, canvas.left), top: Math.max(b.top, canvas.top),
      right: Math.min(b.right, canvas.right), bottom: Math.min(b.bottom, canvas.bottom),
    }))
    .filter(b => b.right > b.left && b.bottom > b.top)
  if (target.top >= canvas.top - 1) boxes.push({ left: 0, top: 0, right: W, bottom: canvas.top })
  return boxes.map(b => ({ ...b, bottom: b.bottom + up }))
}

/** `avoid`: boxes a side placement keeps clear of when it can (see keepClearOf). */
export function placeBubble(r: Box, w: number, h: number, W: number, H: number, avoid: Box[] = []): Placement {
  const p = place(r, w, h, W, H)
  if (p.side === 'inside') return p
  if (p.side === 'right' || p.side === 'left') return clearOf(p, r, w, h, W, H, avoid)
  // Below and above are right and left with x and y swapped.
  const q = clearOf({ ...p, side: p.side === 'below' ? 'right' : 'left', x: p.y, y: p.x }, flip(r), h, w, H, W, avoid.map(flip))
  return { ...q, side: p.side, x: q.y, y: q.x }
}

// Right or left of the target: slide up or down to the nearest free spot, else step outward
// past what's in the way; with nowhere free, stay put.
function clearOf(p: Placement, r: Box, w: number, h: number, W: number, H: number, avoid: Box[]): Placement {
  const free = (x: number, y: number) => !avoid.some(b => x < b.right && x + w > b.left && y < b.bottom && y + h > b.top)
  if (free(p.x, p.y)) return p
  const ys = avoid.flatMap(b => [b.top - GAP - h, b.bottom + GAP]).map(v => clamp(v, EDGE, H - EDGE - h))
  const y = nearest(ys.filter(v => free(p.x, v)), p.y)
  if (y !== undefined) return { ...p, y, tail: along((r.top + r.bottom) / 2, y, h) }
  const out = p.side === 'right' ? 1 : -1
  const xs = avoid.map(b => (out > 0 ? b.right + GAP : b.left - GAP - w))
  const x = nearest(xs.filter(v => (v - p.x) * out > 0 && v >= EDGE && v <= W - EDGE - w && free(v, p.y)), p.x)
  return x === undefined ? p : { ...p, x }
}

function place(r: Box, w: number, h: number, W: number, H: number): Placement {
  const cx = (r.left + r.right) / 2
  const cy = (r.top + r.bottom) / 2
  const x = clamp(cx - w / 2, EDGE, W - EDGE - w)
  const y = clamp(cy - h / 2, EDGE, H - EDGE - h)
  const inside: Placement = { side: 'inside', x, y: r.top + 24, tail: 0 }
  if (r.right - r.left > W / 2 && r.bottom - r.top > H / 2) return inside
  if (r.right + GAP + w <= W - EDGE) return { side: 'right', x: r.right + GAP, y, tail: along(cy, y, h) }
  if (r.left - GAP - w >= EDGE) return { side: 'left', x: r.left - GAP - w, y, tail: along(cy, y, h) }
  if (r.bottom + GAP + h <= H - EDGE) return { side: 'below', x, y: r.bottom + GAP, tail: along(cx, x, w) }
  if (r.top - GAP - h >= EDGE) return { side: 'above', x, y: r.top - GAP - h, tail: along(cx, x, w) }
  return inside
}
