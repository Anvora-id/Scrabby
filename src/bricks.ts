// The Build stage's bricks (DESIGN.md Build card, item 2): the pile Bob stacks, and where they lie once a Build fails.

// Brick widths per row, bottom-up, in 36px units. Every row closes flush, so the pile packs tight.
const ROWS = [[3, 2, 2, 3], [2, 3, 1, 2, 2], [1, 2, 3, 3, 1], [3, 1, 2, 2, 2], [2, 2, 3, 1, 2], [1, 3, 2, 2, 2], [2, 1, 3, 1, 3]]
const COLORS = ['pages', 'ui', 'prim', 'my', 'site', 'content', 'design', 'behavior', 'bob']
const UNIT = 36
export const ROW = 22
export const BRICKS = ROWS.flatMap((widths, row) => widths.map((w, i) => ({ row, left: widths.slice(0, i).reduce((a, b) => a + b, 0) * UNIT, width: w * UNIT - 2 })))
  .map((b, i) => ({ ...b, i, bottom: b.row * ROW, cat: COLORS[i % COLORS.length] }))
export type Brick = (typeof BRICKS)[number]

// A fallen brick: moved (tx, ty) px from its place in the pile and turned r degrees about its bottom centre; top is its highest point.
export interface Lying { i: number; tx: number; ty: number; r: number; top: number }

// Fallen bricks stay 2px inside the stage's left edge (the base starts 28px in) and clear of Bob.
const XMIN = -26
const XMAX = 398
const MIN_TILT = 4
const MAX_TILT = 35
// A brick settles partly in front of the ones under it, which keeps the heap low.
const SINK = 0.8
// How far the top bricks skid left, away from Bob.
const SKID = 90

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
// A fixed jitter per brick, from -1 to 1, so the same pile always falls the same way.
const jitter = (i: number) => ((i * 7919 + 13) % 17) / 8 - 1

// Lays bricks down one by one onto what is already there (y up). A brick rests on the highest point under its left half and
// under its right half, so it leans at their slope; under MIN_TILT it is knocked to 4–8° (dir picks the side), never past MAX_TILT.
function settle(items: { b: Brick; x: number; dir: number }[], sink: number): Lying[] {
  const floor = new Float32Array(XMAX - XMIN + 1)
  const cols = (from: number, to: number) => {
    const out: number[] = []
    for (let x = Math.max(XMIN, Math.round(from)); x < Math.min(XMAX + 1, Math.round(to)); x++) out.push(x - XMIN)
    return out
  }
  const peak = (from: number, to: number) => cols(from, to).reduce((h, k) => Math.max(h, floor[k]), 0)
  return items.map(({ b, x, dir }) => {
    const mid = x + b.width / 2
    const hl = peak(x, mid)
    const hr = peak(mid, x + b.width)
    let deg = -Math.atan2(hr - hl, b.width) * 180 / Math.PI
    if (Math.abs(deg) < MIN_TILT) deg = (deg ? Math.sign(deg) : dir) * (6 + 2 * jitter(b.i))
    deg = clamp(deg, -MAX_TILT, MAX_TILT)
    const a = deg * Math.PI / 180
    const half = b.width / 2 * Math.sin(a)
    // The bottom centre's height: on its supports, sunk a little, with both ends above the floor.
    const y = Math.max(Math.abs(half), Math.max(hl - half, hr + half) * sink)
    for (const k of cols(mid - b.width / 2 * Math.cos(a), mid + b.width / 2 * Math.cos(a))) {
      floor[k] = Math.max(floor[k], y - (k + XMIN - mid) * Math.tan(a) + ROW / Math.cos(a))
    }
    return { i: b.i, tx: x - b.left, ty: b.bottom - y, r: deg, top: y + Math.abs(half) + ROW }
  })
}

// The standing bricks, in pile order, fall into a heap: each lands on the ones before it and is drawn in front of them.
// dy is how far a brick had dropped below its row (px) when the Build failed.
export function heap(standing: { b: Brick; dy: number }[]): Lying[] {
  const top = Math.max(1, ...standing.map(({ b, dy }) => b.bottom - dy))
  return settle(standing.map(({ b, dy }) => {
    const up = (b.bottom - dy) / top
    const dx = -SKID * up * up + jitter(b.i) * 30 * Math.min(1, up * 3)
    return { b, x: Math.round(clamp(b.left + dx, XMIN, XMAX - b.width)), dir: dx < -4 ? -1 : dx > 4 ? 1 : jitter(b.i) >= 0 ? 1 : -1 }
  }), SINK)
}

// A Build that did not start: a Page brick (1 unit), a Content brick (3 units) propped on it, a UI brick (2 units) leaning on
// the Content brick's end. In pile order too, so each is drawn in front of the one it rests on.
export const loose = () => settle([{ b: BRICKS[9], x: 84, dir: 1 }, { b: BRICKS[14], x: 0, dir: -1 }, { b: BRICKS[19], x: 90, dir: 1 }], 1)
