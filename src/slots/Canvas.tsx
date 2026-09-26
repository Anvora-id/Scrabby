import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ICONS } from '../icons.ts'
import type { Pos, Project } from '../model/types.ts'
import { getProject, getUi, setEditing, updateProject, updateProjectWithoutUndo, useProject, useUi } from '../store.ts'
import { getDrag, peekPending, setDrag, takePending, useDrag } from '../canvas/drag.ts'
import type { Pending } from '../canvas/drag.ts'
import { targetAt } from '../canvas/target.ts'
import type { DragRects } from '../canvas/target.ts'
import { canDrop, canTrash, dropItem, isTraitItem, parentMap, removeItem, repairLayout } from '../canvas/tree.ts'
import type { Drop } from '../canvas/tree.ts'
import BlockView from '../canvas/BlockView.tsx'
import TraitPill from '../canvas/TraitPill.tsx'
import { ContextMenu, Tooltip } from '../canvas/Overlays.tsx'
import { flash, MarksContext, Popover, Stepper } from '../canvas/Warnings.tsx'
import { marksOf, stopsOf } from '../canvas/marks.ts'
import { warnings } from '../instructions/warnings.ts'
import styles from '../canvas/Canvas.module.css'
import parts from '../canvas/parts.module.css'
import { droppedBlock } from '../onboarding.ts'
import { DemoButton } from '../shell/Onboarding.tsx'

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
  const ui = useUi()
  const drag = useDrag()
  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const view = useRef({ x: 0, y: 0, z: 1 })
  const savedView = useRef<{ x: number; y: number; z: number } | null>(null)
  const rects = useRef<DragRects | null>(null)
  const pan = useRef<{ x: number; y: number } | null>(null)
  const avatar = useRef<HTMLElement | null>(null)
  const grab = useRef({ x: 0, y: 0 })
  const projectId = useRef(p.id)
  const prevEditing = useRef<string | null>(null)
  const stepAt = useRef(-1)
  const [busy, setBusy] = useState<string | null>(null)
  const [pop, setPop] = useState<{ id: string; x: number; y: number } | null>(null)
  const closePop = useCallback(() => setPop(null), [])

  const ws = useMemo(() => warnings(p), [p])
  const marks = useMemo(() => marksOf(ws), [ws])
  const stops = useMemo(() => stopsOf(ws), [ws])

  // editing is the def id; the def exists only if the Custom Block still exists
  const defId = ui.editing
  const def = defId ? p.defs[defId] : undefined
  const editingId = def ? defId : null
  const defBlockId = editingId ? def!.blockId : null

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
    // Entering edit view: save current view, reset to {0,0,1}
    if (editingId && !prevEditing.current) {
      savedView.current = { ...view.current }
      view.current = { x: 0, y: 0, z: 1 }
    }
    // Leaving edit view: restore saved view
    if (!editingId && prevEditing.current) {
      if (savedView.current) {
        view.current = savedView.current
        savedView.current = null
      }
    }
    prevEditing.current = editingId
    apply()
  })

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

  const itemEl = (id: string) => worldRef.current?.querySelector<HTMLElement>(`[data-bid="${id}"], [data-tid="${id}"]`)

  function show(id: string) {
    const vp = viewportRef.current!, el = itemEl(id)
    if (!el) return
    const r = el.getBoundingClientRect(), vr = vp.getBoundingClientRect(), v = view.current
    v.x += vp.clientWidth * 0.42 - (r.left - vr.left + Math.min(r.width, 400) / 2)
    v.y += vp.clientHeight * 0.4 - (r.top - vr.top + Math.min(r.height, 200) / 2)
    apply()
    flash(el)
  }

  function openPop(id: string) {
    const el = document.querySelector(`[data-badge="${id}"]`) ?? itemEl(id)
    if (!el) return
    const r = el.getBoundingClientRect()
    setPop({ id, x: r.left, y: r.bottom + 6 })
  }

  function go(d: 1 | -1) {
    const n = stops.length
    if (!n) return
    stepAt.current = stepAt.current < 0 ? (d === 1 ? 0 : n - 1) : (stepAt.current + d + n) % n
    const id = stops[stepAt.current].target!
    const finish = () => { show(id); openPop(id) }
    if (itemEl(id)) return finish()
    updateProjectWithoutUndo(q => {
      const parents = parentMap(q)
      for (let a = parents.get(id); a && a !== 'canvas'; a = parents.get(a)) q.blocks[a].folded = false
    })
    requestAnimationFrame(finish)
  }

  // The item the user is working on hides its mark until they move on (§10.3).
  useEffect(() => {
    const on = (e: Event) => {
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest('[data-badge], [data-wpop]')) return
      const el = t?.closest<HTMLElement>('[data-tid], [data-bid]')
      setBusy(el ? el.dataset.tid ?? el.dataset.bid! : null)
    }
    window.addEventListener('pointerdown', on, true)
    window.addEventListener('focusin', on, true)
    return () => {
      window.removeEventListener('pointerdown', on, true)
      window.removeEventListener('focusin', on, true)
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
      let newId = ''
      updateProject(q => { newId = dropItem(q, item, to) })
      setBusy(newId)
      if (item.kind === 'newBlock' || item.kind === 'newInstance') droppedBlock(newId)
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
  // Instances count for the EditBar
  const instanceCount = editingId ? Object.values(p.blocks).filter(b => b.inst === editingId).length : 0
  const defName = defBlockId ? (p.blocks[defBlockId]?.name ?? '') : ''
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
        <MarksContext.Provider value={editingId ? { marks: new Map(), busy: null, open: () => {} } : { marks, busy, open: openPop }}>
        {editingId && defBlockId ? (
          <div className={styles.placed} style={{ left: 40, top: 70 }}>
            <BlockView p={p} id={defBlockId} />
          </div>
        ) : (
          <>
            {canvas.children.map((id, i) => (
              <div key={id} className={styles.placed} style={at(p.blocks[id]?.pos, i)}>
                <BlockView p={p} id={id} />
                {p.blocks[id]?.type === 'site' && !p.blocks[id].children.length && <DemoButton />}
              </div>
            ))}
            {canvas.traits.map((id, i) => (
              <div key={id} className={styles.placed} style={at(p.traits[id]?.pos, canvas.children.length + i)}>
                <TraitPill p={p} id={id} />
              </div>
            ))}
          </>
        )}
        </MarksContext.Provider>
      </div>
      {editingId && (
        <div className={styles.editBar}>
          Editing Custom Block "{defName}". Changes reach all {instanceCount} Instance{instanceCount === 1 ? '' : 's'}, except parts an Instance changed itself.
          <button className={styles.editBarDone} onClick={() => setEditing(null)}>Done</button>
        </div>
      )}
      {!editingId && <Stepper count={stops.length} clean={!ws.length} onGo={go} />}
      {!editingId && pop && marks.has(pop.id) && (
        <Popover p={p} id={pop.id} ws={marks.get(pop.id)!} x={pop.x} y={pop.y} onShow={show} onClose={closePop} />
      )}
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
      <ContextMenu p={p} />
      <Tooltip p={p} />
    </div>
  )
}
