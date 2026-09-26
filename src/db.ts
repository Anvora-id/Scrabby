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
    indexes: { updated: number }
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
        const projects = db.createObjectStore('projects', { keyPath: 'id' })
        projects.createIndex('updated', 'updated')
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
  const all = await db.getAllFromIndex('projects', 'updated')
  if (all.length === 0) return undefined
  return all[all.length - 1]
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
