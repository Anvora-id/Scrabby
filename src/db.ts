import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Asset, Checkpoint, Project } from './model/types.ts'

export interface AssetBlob {
  projectId: string
  id: string
  blob: Blob
}

interface ScrabbyDB extends DBSchema {
  projects: {
    key: string
    value: Project
  }
  checkpoints: {
    key: [string, number]
    value: Checkpoint
    indexes: { projectId: string }
  }
  assets: {
    key: [string, string]
    value: AssetBlob
    indexes: { projectId: string }
  }
}

let dbPromise: Promise<IDBPDatabase<ScrabbyDB>> | null = null

function getDb(): Promise<IDBPDatabase<ScrabbyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ScrabbyDB>('scrabby', 1, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'id' })
        const checkpoints = db.createObjectStore('checkpoints', { keyPath: ['projectId', 'number'] })
        checkpoints.createIndex('projectId', 'projectId')
        const assets = db.createObjectStore('assets', { keyPath: ['projectId', 'id'] })
        assets.createIndex('projectId', 'projectId')
      },
    })
  }
  return dbPromise
}

export async function loadLatestProject(): Promise<Project | undefined> {
  const db = await getDb()
  const all = await db.getAll('projects')
  return all.sort((a, b) => b.updated - a.updated)[0]
}

export async function saveProject(p: Project): Promise<void> {
  const db = await getDb()
  await db.put('projects', p)
}

export async function clearAll(): Promise<void> {
  const db = await getDb()
  await db.clear('projects')
  await db.clear('checkpoints')
  await db.clear('assets')
}

export async function listCheckpoints(projectId: string): Promise<Checkpoint[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('checkpoints', 'projectId', projectId)
  return all.sort((a, b) => a.number - b.number)
}

export async function addCheckpoint(c: Checkpoint): Promise<void> {
  const db = await getDb()
  await db.add('checkpoints', c)
}

export async function putAsset(a: AssetBlob): Promise<void> {
  const db = await getDb()
  await db.put('assets', a)
}

export async function getAsset(projectId: string, id: string): Promise<AssetBlob | undefined> {
  const db = await getDb()
  return db.get('assets', [projectId, id])
}

export async function listAssets(projectId: string): Promise<AssetBlob[]> {
  const db = await getDb()
  return db.getAllFromIndex('assets', 'projectId', projectId)
}

/** Deletes the Blobs of Assets the Project no longer lists. */
export async function pruneAssets(p: Project): Promise<void> {
  const keep = new Set(p.assets.map(a => a.id))
  const db = await getDb()
  for (const b of await db.getAllFromIndex('assets', 'projectId', p.id)) {
    if (!keep.has(b.id)) await db.delete('assets', [p.id, b.id])
  }
}

// re-export Asset type for consumers that import from db
export type { Asset }
