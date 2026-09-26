import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { listAssets, type AssetBlob } from '../db.ts'
import { checkpointTitle } from '../checkpoints.ts'
import { ICONS } from '../icons.ts'
import { cx } from '../canvas/cx.ts'
import { onRedraw, previewHooks, takeFlash } from '../preview.ts'
import { getProject, useProject } from '../store.ts'
import type { Project } from '../model/types.ts'
import styles from './Preview.module.css'

const ORIGIN = import.meta.env.VITE_PREVIEW_ORIGIN || location.protocol + '//' + location.hostname + ':5174'
const LIVE_DELAY = 400

interface Pending { projectId: string; files: Project['files']; assets: { path: string; blob: Blob }[]; path: string; flash: string[] }
interface PageError { message: string; file: string }

// ponytail: compares the whole code as JSON on every render; fine for small sites, hash per file if it gets slow.
const codeOf = (p: Project) => JSON.stringify([p.files, p.assets])

function fileOf(url: string): string {
  const raw = new URL(url, ORIGIN).pathname.replace(/^\/preview\/[^/]+\//, '')
  let path = raw
  try { path = decodeURI(raw) } catch { /* a malformed escape: keep the raw path */ }
  return path || 'index.html'
}

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site'

export default function Preview() {
  const p = useProject()
  const code = codeOf(p)
  const [page, setPage] = useState('index.html')
  const [sent, setSent] = useState('')
  const [load, setLoad] = useState(0)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<PageError | null>(null)
  const [noWorker, setNoWorker] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const sizeButton = useRef<HTMLButtonElement>(null)
  // Null until the first redraw, so the shell never gets an empty load that wipes its cache (TDD §13).
  const pending = useRef<Pending | null>(null)
  const calls = useRef(0)
  const stale = code !== sent

  async function redraw(path = page): Promise<void> {
    const call = ++calls.current
    const now = getProject()
    const blobs = await listAssets(now.id).catch((e): AssetBlob[] => { console.error('Reading the Library failed', e); return [] })
    if (call !== calls.current) return
    const byId = new Map(blobs.map(b => [b.id, b.blob]))
    const assets = now.assets.flatMap(a => {
      const blob = byId.get(a.id)
      return blob ? [{ path: 'assets/' + a.file, blob }] : []
    })
    setSent(codeOf(now))
    pending.current = { projectId: now.id, files: now.files, assets, path, flash: takeFlash() }
    setLoad(n => n + 1)
  }

  function onMessage(e: MessageEvent): void {
    const win = frame.current?.contentWindow
    if (e.origin !== ORIGIN || !win || e.source !== win) return
    const d = e.data
    if (d?.preview === 'ready') {
      if (!pending.current) return
      const { projectId, files, assets, path } = pending.current
      win.postMessage({ preview: 'files', projectId, files, assets, path }, ORIGIN)
    } else if (d?.preview === 'no-worker') {
      setNoWorker(String(d.message))
    } else if (d?.preview === 'error') {
      setError({ message: String(d.message), file: d.file ? fileOf(String(d.file)) : page })
    } else if (d?.preview === 'page') {
      setError(null)
      const path = fileOf(String(d.path))
      if (path !== page && codeOf(getProject()) !== sent) {
        redraw(path)
        return
      }
      setPage(path)
      const next = pending.current
      if (next?.flash.length) {
        const ids = next.flash
        next.flash = []
        win.postMessage({ preview: 'flash', ids }, ORIGIN)
      }
    }
  }

  // Listeners registered once call the latest render's functions, so they see the current page and code.
  const latest = useRef({ redraw, onMessage })
  useLayoutEffect(() => { latest.current = { redraw, onMessage } })

  useEffect(() => {
    latest.current.redraw()
    const handle = (e: MessageEvent) => latest.current.onMessage(e)
    addEventListener('message', handle)
    const off = onRedraw(() => latest.current.redraw())
    return () => { removeEventListener('message', handle); off() }
  }, [])

  useEffect(() => {
    if (!stale || paused) return
    const t = setTimeout(() => latest.current.redraw(), LIVE_DELAY)
    return () => clearTimeout(t)
  }, [code, sent, paused, stale])

  // Closing puts focus back on the full-size button, so the keyboard doesn't land on the page.
  function shrink() {
    setFull(false)
    sizeButton.current?.focus()
  }

  // ponytail: Esc reaches the app only while it has focus; after a click in the website (another origin) the button or the backdrop closes it.
  useEffect(() => {
    if (!full) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') shrink() }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [full])

  const built = Object.keys(p.files).length > 0
  const Reload = ICONS.reload
  const Size = full ? ICONS.normal_size : ICONS.full_size

  // Full size only swaps a class, so the frame stays put and the page doesn't reload.
  return (
    <>
      {full && <div className={styles.backdrop} onClick={shrink} />}
      <div className={cx(styles.root, full && styles.full)}>
        <div className={styles.bar}>
          <button className={styles.ghost} title="Reload the page with your latest code" onClick={() => redraw()}>
            <Reload size={16} weight="bold" />
            {paused && stale && <span className={styles.dot} aria-label="Your code has changed" />}
          </button>
          {built && (
            <button ref={sizeButton} className={styles.ghost} title={full ? 'Back to normal size' : 'Show the website full size'} onClick={() => setFull(!full)}>
              <Size size={16} weight="bold" />
            </button>
          )}
          <span className={styles.pill}>{built ? `${slugOf(p.name)} / ${page}` : 'not built yet'}</span>
          {p.checkpoint !== undefined && <span>{checkpointTitle(p, p.checkpoint)}</span>}
          <label className={styles.switch}>
            Pause live updates
            <input
              type="checkbox"
              role="switch"
              checked={paused}
              onChange={e => {
                setPaused(e.target.checked)
                if (!e.target.checked) redraw()
              }}
            />
            <span className={styles.track} />
          </label>
        </div>
        {paused && <div className={styles.strip}>Live updates are paused. Press ↻ to see your latest code.</div>}
        <div className={styles.body}>
          <div className={styles.frame}>
            {!built ? (
              <div className={styles.empty}>
                <p>Press Build to make your website.</p>
              </div>
            ) : noWorker !== null ? (
              <div className={styles.card} role="alert">
                <b>The Preview can't start in this browser.</b>
                <p>It needs a Service Worker, and the browser blocked it. Brave and strict privacy settings can do this. Try Chrome, or allow this site to store data.</p>
                <small>{noWorker}</small>
              </div>
            ) : load > 0 && (
              <iframe key={load} ref={frame} className={styles.page} src={ORIGIN + '/'} title="Preview of your website" />
            )}
            {built && error && (
              <div className={styles.error} role="alert">
                <span className={styles.bang}>!</span>
                <b>Something on this page isn't working</b>
                <span className={styles.message}>{error.message}</span>
                <button className={styles.ghost} onClick={() => { setFull(false); previewHooks.askBobToFix(error) }}>Ask Bob to fix it</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
