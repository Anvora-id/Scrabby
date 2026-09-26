import { useEffect, useLayoutEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ICONS } from '../icons.ts'
import type { Pos, Project } from '../model/types.ts'
import { getProject, getUi, updateProject, useProject } from '../store.ts'
import { getDrag, peekPending, setDrag, takePending, useDrag } from '../canvas/drag.ts'
import type { Pending } from '../canvas/drag.ts'
import { targetAt } from '../canvas/target.ts'
import type { DragRects } from '../canvas/target.ts'
import { canDrop, canTrash, dropItem, isTraitItem, removeItem, repairLayout } from '../canvas/tree.ts'
import type { Drop } from '../canvas/tree.ts'
import BlockView from '../canvas/BlockView.tsx'
import TraitPill from '../canvas/TraitPill.tsx'
import styles from '../canvas/Canvas.module.css'
import parts from '../canvas/parts.module.css'

const MIN_ZOOM = 0.3
const MAX_ZOOM = 2
const CORNER = 40
const DOTS = 24

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const at = (pos: Pos | undefined, i: number) => ({ left: pos?.x ?? 20 + i * 40, top: pos?.y ?? 20 + i * 40 })

// A Block that never had a layout gets one on its first drop; repair layouts and sort keys so that alone is no change.
function shape(p: Project): string {
  const blocks = Object.values(p.blocks).map(b => ({ ...b, layout: repairLayout(b) }))
  return JSON.stringify([blocks, p.traits], (_, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v)
}

function measure(world: HTMLElement): DragRects {
  const rects = (sel: string, key: 'bid' | 'tid') => new Map(
    [...world.querySelectorAll<HTMLElement>(sel)]
      .filter(el => el.getClientRects().length > 0)
      .map(el => [el.dataset[key]!, el.getBoundingClientRect()]),
  )
  return { blocks: rects('[data-bid]', 'bid'), traits: rects('[data-tid]', 'tid') }
}

export default function Canvas() {
  const p = useProject()
  const drag = useDrag()
  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const view = useRef({ x: 0, y: 0, z: 1 })
  const rects = useRef<DragRects | null>(null)
  const pan = useRef<{ x: number; y: number } | null>(null)
  const avatar = useRef<HTMLElement | null>(null)
  const grab = useRef({ x: 0, y: 0 })
  const projectId = useRef(p.id)

  function apply() {
    const vp = viewportRef.current, world = worldRef.current
    if (!vp || !world) return
    const v = view.current
    const boxes = [...world.children] as HTMLElement[]
    if (boxes.length > 0) {
      const minLeft = Math.min(...boxes.map(b => b.offsetLeft))
      const maxRight = Math.max(...boxes.map(b => b.offsetLeft + b.offsetWidth))
      const minTop = Math.min(...boxes.map(b => b.offsetTop))
      const maxBottom = Math.max(...boxes.map(b => b.offsetTop + b.offsetHeight))
      v.x = clamp(v.x, CORNER - v.z * maxRight, vp.clientWidth - CORNER - v.z * minLeft)
      v.y = clamp(v.y, CORNER - v.z * maxBottom, vp.clientHeight - CORNER - v.z * minTop)
    }
    world.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.z})`
    vp.style.backgroundPosition = `${v.x}px ${v.y}px`
    vp.style.backgroundSize = `${DOTS * v.z}px ${DOTS * v.z}px`
  }

  function zoomAt(mx: number, my: number, z: number) {
    const v = view.current
    z = clamp(z, MIN_ZOOM, MAX_ZOOM)
    v.x = mx - ((mx - v.x) / v.z) * z
    v.y = my - ((my - v.y) / v.z) * z
    v.z = z
    apply()
  }

  function zoomCenter(z: number) {
    const vp = viewportRef.current!
    zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, z)
  }

  useLayoutEffect(() => {
    if (p.id !== projectId.current) {
      projectId.current = p.id
      view.current = { x: 0, y: 0, z: 1 }
    }
    apply()
  })
  // issue 07: entering the edit view remembers the Canvas view and starts at {0, 0, 1}; leaving restores it.

  useEffect(() => {
    const vp = viewportRef.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const d = getDrag()
      if (d) {
        rects.current = null
        setDrag({ ...d, target: null })
      }
      if (e.ctrlKey) {
        const r = vp.getBoundingClientRect()
        zoomAt(e.clientX - r.left, e.clientY - r.top, view.current.z * Math.exp(-e.deltaY * 0.002))
      } else {
        view.current.x -= e.deltaX
        view.current.y -= e.deltaY
        apply()
      }
    }
    const onResize = () => apply()
    vp.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)
    return () => {
      vp.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  function onPanStart(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 1 && !(e.button === 0 && (e.target === viewportRef.current || e.target === worldRef.current))) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.classList.add(styles.panning)
    pan.current = { x: e.clientX - view.current.x, y: e.clientY - view.current.y }
  }

  function onPanMove(e: ReactPointerEvent) {
    if (!pan.current) return
    view.current.x = e.clientX - pan.current.x
    view.current.y = e.clientY - pan.current.y
    apply()
  }

  function onPanEnd(e: ReactPointerEvent<HTMLDivElement>) {
    pan.current = null
    e.currentTarget.classList.remove(styles.panning)
  }

  useEffect(() => {
    function start(pending: Pending) {
      const el = pending.el
      const r = el.getBoundingClientRect()
      grab.current = { x: pending.x - r.left, y: pending.y - r.top }
      const a = el.cloneNode(true) as HTMLElement
      const fields = a.querySelectorAll<HTMLInputElement>('input, textarea, select')
      el.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((f, i) => { fields[i].value = f.value })
      a.classList.add(styles.avatar)
      a.classList.remove(parts.over)
      if (worldRef.current?.contains(el)) a.style.transform = `scale(${view.current.z})`
      document.body.append(a)
      avatar.current = a
      document.body.style.userSelect = 'none'
      getSelection()?.removeAllRanges()
      setDrag({ item: pending.item, w: el.offsetWidth, h: el.offsetHeight, pill: isTraitItem(pending.item), target: null, trash: false })
    }

    function onMove(e: PointerEvent) {
      if (!getDrag()) {
        const pending = peekPending()
        if (!pending || Math.hypot(e.clientX - pending.x, e.clientY - pending.y) <= 4) return
        start(takePending()!)
      }
      const d = getDrag()!
      avatar.current!.style.left = `${e.clientX - grab.current.x}px`
      avatar.current!.style.top = `${e.clientY - grab.current.y}px`
      const p = getProject()
      const under = document.elementFromPoint(e.clientX, e.clientY)
      let next: { target: Drop | null; trash: boolean } = { target: null, trash: false }
      if (under?.closest('[data-palette]')) next.trash = canTrash(p, d.item)
      else if (!under || !viewportRef.current?.contains(under) || !rects.current) { /* nothing takes it */ }
      else if (!under.closest('[data-bid]')) {
        if (!getUi().editing && canDrop(p, d.item, 'canvas')) next.target = { id: 'canvas' }
      } else next.target = targetAt(p, rects.current, d.item, e.clientX, e.clientY)
      if (JSON.stringify(next) !== JSON.stringify({ target: d.target, trash: d.trash })) setDrag({ ...d, ...next })
    }

    function end(e: PointerEvent) {
      takePending()
      const d = getDrag()
      if (!d) return
      avatar.current?.remove()
      avatar.current = null
      document.body.style.userSelect = ''
      rects.current = null
      setDrag(null)
      if (e.type === 'pointercancel') return
      const { item, target, trash } = d
      if (trash) {
        if (item.kind === 'block' || item.kind === 'trait') updateProject(q => removeItem(q, item.id))
        return
      }
      if (!target) return
      const to: Drop = { ...target }
      if (target.id === 'canvas') {
        const r = viewportRef.current!.getBoundingClientRect(), v = view.current
        to.pos = {
          x: Math.round((e.clientX - grab.current.x - r.left - v.x) / v.z),
          y: Math.round((e.clientY - grab.current.y - r.top - v.y) / v.z),
        }
      }
      const p = getProject()
      const dry = structuredClone(p)
      dropItem(dry, item, to)
      if (shape(dry) === shape(p)) return
      updateProject(q => { dropItem(q, item, to) })
      // issue 08: make the dropped item busy (§10.3). issue 15: droppedBlock(id) for a new Block.
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [])

  useLayoutEffect(() => {
    const line = lineRef.current!
    line.hidden = true
    if (!drag) return
    rects.current ??= measure(worldRef.current!)
    const g = worldRef.current!.querySelector('[data-ghost]')?.getBoundingClientRect()
    if (!g || !drag.target) return
    const where = drag.target.slot?.where
    const s = line.style
    if (drag.target.tIdx !== undefined || where === 'left' || where === 'right') {
      s.left = `${where === 'right' ? g.left - 5 : g.right + 1}px`
      s.top = `${g.top}px`
      s.width = '4px'
      s.height = `${g.height}px`
    } else {
      s.left = `${g.left}px`
      s.top = `${where === 'above' || where === 'rowBefore' ? g.bottom + 1 : g.top - 5}px`
      s.width = `${g.width}px`
      s.height = '4px'
    }
    line.hidden = false
  }, [drag])

  const canvas = p.blocks.canvas
  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      onPointerDown={onPanStart}
      onPointerMove={onPanMove}
      onPointerUp={onPanEnd}
      onPointerCancel={onPanEnd}
      onMouseDown={e => { if (e.button === 1) e.preventDefault() }}
      onAuxClick={e => { if (e.button === 1) e.preventDefault() }}
    >
      <div ref={worldRef} className={styles.world}>
        {/* issue 08: MarksContext.Provider (§10.3). issue 07: the edit view shows only the definition, at left 40, top 70. */}
        {canvas.children.map((id, i) => (
          <div key={id} className={styles.placed} style={at(p.blocks[id]?.pos, i)}>
            <BlockView p={p} id={id} />
            {/* issue 15: <DemoButton/> under a Site Block that has no children */}
          </div>
        ))}
        {canvas.traits.map((id, i) => (
          <div key={id} className={styles.placed} style={at(p.traits[id]?.pos, canvas.children.length + i)}>
            <TraitPill p={p} id={id} />
          </div>
        ))}
      </div>
      {/* issue 07: EditBar. issue 08: <Stepper> and <Popover>. */}
      <div className={styles.zoom}>
        <button className={styles.zoomButton} title="Zoom in" onClick={() => zoomCenter(view.current.z * 1.25)}>
          <ICONS.zoom_in size={18} />
        </button>
        <button className={styles.zoomButton} title="Zoom out" onClick={() => zoomCenter(view.current.z / 1.25)}>
          <ICONS.zoom_out size={18} />
        </button>
        <button className={styles.zoomButton} title="Reset zoom" onClick={() => zoomCenter(1)}>
          <ICONS.zoom_reset size={18} />
        </button>
      </div>
      <div ref={lineRef} className={styles.dropLine} />
      {/* issue 06: <ContextMenu/>, <Tooltip/> */}
    </div>
  )
}
