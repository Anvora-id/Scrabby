import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { listAssets, listCheckpoints, type AssetBlob } from '../db.ts'
import { ICONS } from '../icons.ts'
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
  const path = decodeURIComponent(new URL(url, ORIGIN).pathname.replace(/^\/preview\/[^/]+\//, ''))
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
  const [builds, setBuilds] = useState(0)
  const frame = useRef<HTMLIFrameElement>(null)
  const pending = useRef<Pending>({ projectId: '', files: {}, assets: [], path: 'index.html', flash: [] })
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
      const ids = pending.current.flash
      if (ids.length) {
        pending.current.flash = []
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

  useEffect(() => {
    let on = true
    listCheckpoints(p.id)
      .then(cs => { if (on) setBuilds(cs.filter(c => c.blocks).length) })
      .catch(e => console.error('Loading the Checkpoints failed', e))
    return () => { on = false }
  }, [p.id, code])

  const built = Object.keys(p.files).length > 0
  const Reload = ICONS.reload

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <button className={styles.ghost} title="Reload the page with your latest code" onClick={() => redraw()}>
          <Reload size={16} weight="bold" />
          {paused && stale && <span className={styles.dot} aria-label="Your code has changed" />}
        </button>
        <span className={styles.pill}>{built ? `${slugOf(p.name)} / ${page}` : 'not built yet'}</span>
        {builds > 0 && <span>Build {builds}</span>}
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
              <img src="/bob.svg" alt="" height={64} />
              <p>Press Build to make your website.</p>
            </div>
          ) : noWorker !== null ? (
            <div className={styles.card} role="alert">
              <b>The Preview can't start in this browser.</b>
              <p>It needs a Service Worker, and the browser blocked it. Brave and strict privacy settings can do this. Try Chrome, or allow this site to store data.</p>
              <small>{noWorker}</small>
            </div>
          ) : (
            <iframe key={load} ref={frame} className={styles.page} src={ORIGIN + '/'} title="Preview of your website" />
          )}
          {built && error && (
            <div className={styles.error} role="alert">
              <span className={styles.bang}>!</span>
              <b>Something on this page isn't working</b>
              <span className={styles.message}>{error.message}</span>
              <button className={styles.ghost} onClick={() => previewHooks.askBobToFix(error)}>Ask Bob to fix it</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
