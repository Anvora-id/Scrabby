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
    dbPromise = openDB<ScrabbyDB>('scrabby', 2, {
      async upgrade(db, from, _, tx) {
        if (from < 1) {
          db.createObjectStore('projects', { keyPath: 'id' })
          const checkpoints = db.createObjectStore('checkpoints', { keyPath: ['projectId', 'number'] })
          checkpoints.createIndex('projectId', 'projectId')
          const assets = db.createObjectStore('assets', { keyPath: ['projectId', 'id'] })
          assets.createIndex('projectId', 'projectId')
          return
        }
        // Version 1 Checkpoints held code and built Blocks apart; they can't be restored, so they go, with the Project's links to them.
        await tx.objectStore('checkpoints').clear()
        const projects = tx.objectStore('projects')
        for (const p of await projects.getAll()) {
          delete p.checkpoint
          delete p.checkpointNames
          await projects.put(p)
        }
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

export async function deleteAsset(projectId: string, id: string): Promise<void> {
  const db = await getDb()
  await db.delete('assets', [projectId, id])
}

// re-export Asset type for consumers that import from db
export type { Asset }
