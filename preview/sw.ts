import { answer, toEntries, type PreviewFiles } from './serve.ts'

// The project's lib is DOM, not WebWorker, so the few worker types used here are declared locally.
interface ExtendableEvent extends Event { waitUntil(p: Promise<unknown>): void }
interface FetchEvent extends Event { request: Request; respondWith(r: Promise<Response>): void }
interface WorkerScope {
  location: Location
  clients: { claim(): Promise<void> }
  skipWaiting(): Promise<void>
  addEventListener(type: 'install' | 'activate', fn: (e: ExtendableEvent) => void): void
  addEventListener(type: 'message', fn: (e: ExtendableEvent & MessageEvent<PreviewFiles>) => void): void
  addEventListener(type: 'fetch', fn: (e: FetchEvent) => void): void
}
const sw = self as unknown as WorkerScope

let storing: Promise<void> = Promise.resolve()

sw.addEventListener('install', e => e.waitUntil(sw.skipWaiting()))
sw.addEventListener('activate', e => e.waitUntil(sw.clients.claim()))

sw.addEventListener('message', e => {
  const { projectId, files, assets } = e.data
  storing = storing.then(async () => {
    await caches.delete('preview')
    const cache = await caches.open('preview')
    await Promise.all(toEntries(projectId, files, assets).map(([key, res]) => cache.put(key, res)))
    e.ports[0].postMessage('stored')
  }).catch(err => console.error('Storing the Preview files failed', err))
  e.waitUntil(storing)
})

sw.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.origin !== sw.location.origin || !url.pathname.startsWith('/preview/')) return
  e.respondWith(
    storing
      .then(() => answer(url.pathname, key => caches.open('preview').then(c => c.match(key))))
      .then(r => r ?? fetch(e.request)),
  )
})
