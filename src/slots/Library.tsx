import { useEffect, useRef, useState } from 'react'
import { ImageIcon, PencilSimpleIcon, TrashIcon, VideoCameraIcon } from '@phosphor-icons/react'
import { getProject, updateProject, useProject } from '../store.ts'
import {
  addAsset, deleteWarning, formatBytes, removeAsset, renameAsset, renamedFile, renameProblem, uploadKind,
} from '../model/library.ts'
import { deleteAsset, listAssets, putAsset } from '../db.ts'
import type { Asset, AssetKind } from '../model/types.ts'
import { Warning } from '../shell/Warning.tsx'
import styles from './Library.module.css'

type Ask = { kind: 'rename'; a: Asset; typed: string; to: string } | { kind: 'delete'; a: Asset }

const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm'

async function measure(file: File, kind: AssetKind): Promise<{ width: number; height: number; seconds?: number }> {
  if (kind === 'image') {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  }
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.preload = 'metadata'
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve
      video.onerror = reject
      video.src = url
    })
    return { width: video.videoWidth, height: video.videoHeight, seconds: video.duration }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function upload(files: File[], onSaved: () => void): Promise<string[]> {
  const problems: string[] = []
  for (const file of files) {
    const kind = uploadKind(file)
    if (kind !== 'image' && kind !== 'video') { problems.push(kind); continue }
    let size
    try { size = await measure(file, kind) } catch {
      problems.push(`${file.name} can't be opened. It may be damaged.`)
      continue
    }
    let id = ''
    updateProject(d => { id = addAsset(d, file.name, { kind, mime: file.type, bytes: file.size, ...size }) })
    try {
      await putAsset({ projectId: getProject().id, id, blob: file })
      onSaved()
    } catch (e) {
      console.error('Saving an Asset failed', e)
      updateProject(d => removeAsset(d, id))
      problems.push(`${file.name} couldn't be saved. The browser's storage may be full.`)
    }
  }
  return problems
}

export default function Library() {
  const project = useProject()
  const input = useRef<HTMLInputElement>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [storage, setStorage] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [renameErr, setRenameErr] = useState<string | null>(null)
  const [ask, setAsk] = useState<Ask | null>(null)
  // Bumped after a Blob is stored: the Asset appears in the Project before its Blob does.
  const [saved, setSaved] = useState(0)

  // Reload only when Assets come or go, not on every Project edit.
  const projectId = project.id
  const ids = project.assets.map(a => a.id).join(',')
  useEffect(() => {
    let live = true
    const made: string[] = []
    listAssets(projectId).then(blobs => {
      if (!live) return
      const next: Record<string, string> = {}
      for (const b of blobs) {
        if (!b.blob.type.startsWith('image/')) continue
        next[b.id] = URL.createObjectURL(b.blob)
        made.push(next[b.id])
      }
      setUrls(next)
    }).catch(e => console.error('Loading the Library failed', e))
    navigator.storage?.estimate?.().then(({ usage = 0, quota }) => {
      if (live && quota) setStorage(`${formatBytes(usage)} of ${formatBytes(quota)} browser storage used`)
    }).catch(() => {})
    return () => { live = false; made.forEach(u => URL.revokeObjectURL(u)) }
  }, [projectId, ids, saved])

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    upload(files, () => setSaved(n => n + 1)).then(setProblems)
  }

  function startRename(a: Asset) {
    setRenaming(a.id)
    setDraft(a.file)
    setRenameErr(null)
  }

  function commitRename(a: Asset) {
    const typed = draft.trim()
    const p = getProject()
    if (!typed) return setRenaming(null)
    const problem = renameProblem(p, a.id, typed)
    if (problem) return setRenameErr(problem)
    setRenaming(null)
    const to = renamedFile(p, a.id, typed)
    if (to !== a.file) setAsk({ kind: 'rename', a, typed, to })
  }

  function go(ask: Ask) {
    setAsk(null)
    const { a } = ask
    if (ask.kind === 'rename') return updateProject(d => renameAsset(d, a.id, ask.typed))
    updateProject(d => removeAsset(d, a.id))
    deleteAsset(projectId, a.id).catch(e => console.error('Deleting an Asset failed', e))
  }

  return (
    <div className={styles.library}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.heading}>Library</h2>
          <p className={styles.hint}>Images and videos for this Project. Pick one inside an image or video Trait.</p>
        </div>
        <button className={styles.upload} onClick={() => input.current?.click()}>Upload</button>
        <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={pick} />
      </div>

      {problems.length > 0 && (
        <div className={styles.problems} role="alert">
          {problems.map((text, i) => <p key={i}>{text}</p>)}
          <button className={styles.textBtn} onClick={() => setProblems([])}>Dismiss</button>
        </div>
      )}

      {project.assets.length === 0 ? (
        <div className={styles.empty}>
          <img className={styles.bob} src="/bob-head.svg" alt="" />
          Nothing here yet. Upload an image or a video.
        </div>
      ) : (
        <div className={styles.grid}>
          {project.assets.map(a => {
            const Icon = a.kind === 'video' ? VideoCameraIcon : ImageIcon
            return (
              <div key={a.id} className={styles.tile} title={`${a.file} · ${formatBytes(a.bytes)}`}>
                {urls[a.id]
                  ? <img className={styles.thumb} src={urls[a.id]} alt="" />
                  : <Icon className={styles.icon} size={40} weight="duotone" />}
                {renaming === a.id ? (
                  <>
                    <input
                      className={styles.renameInput}
                      autoFocus
                      aria-label={`New name for ${a.file}`}
                      value={draft}
                      onChange={e => { setDraft(e.target.value); setRenameErr(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(a)
                        else if (e.key === 'Escape') setRenaming(null)
                      }}
                      onBlur={() => setRenaming(null)}
                    />
                    {renameErr && <span className={styles.problem}>{renameErr}</span>}
                  </>
                ) : (
                  <span className={styles.name}>{a.file}</span>
                )}
                <div className={styles.actions}>
                  <button title="Rename" aria-label={`Rename ${a.file}`} onClick={() => startRename(a)}>
                    <PencilSimpleIcon size={14} weight="fill" />
                  </button>
                  <button title="Delete" aria-label={`Delete ${a.file}`} onClick={() => setAsk({ kind: 'delete', a })}>
                    <TrashIcon size={14} weight="fill" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {storage && <p className={styles.storage}>{storage}</p>}

      {ask?.kind === 'rename' && (
        <Warning
          icon={PencilSimpleIcon}
          title={`Rename ${ask.a.file} to ${ask.to}?`}
          lines={[`Code that references assets/${ask.a.file} won't be updated and will break. You can ask the Assistant to fix the references.`]}
          confirm="Rename"
          onCancel={() => setAsk(null)}
          onConfirm={() => go(ask)}
        />
      )}
      {ask?.kind === 'delete' && (
        <Warning
          icon={TrashIcon}
          title={`Delete ${ask.a.file}?`}
          lines={[deleteWarning(project, ask.a.id)]}
          confirm="Delete"
          danger
          onCancel={() => setAsk(null)}
          onConfirm={() => go(ask)}
        />
      )}
    </div>
  )
}
