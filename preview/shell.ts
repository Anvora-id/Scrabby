const APP = import.meta.env.VITE_APP_ORIGIN || location.protocol + '//' + location.hostname + ':5173'

function tell(preview: string, rest: object = {}): void {
  parent.postMessage({ preview, ...rest }, APP)
}

function fail(e: unknown): void {
  tell('no-worker', { message: String((e as Error)?.message ?? e) })
}

async function start(): Promise<void> {
  if (!('serviceWorker' in navigator)) throw new Error('Service Workers are turned off here.')
  await navigator.serviceWorker.register(import.meta.env.DEV ? '/sw.ts' : '/sw.js', { type: 'module' })
  const reg = await navigator.serviceWorker.ready
  addEventListener('message', e => {
    // Only the app may hand over files; anything else could plant a page on this origin.
    if (e.source !== parent || e.origin !== APP || e.data?.preview !== 'files') return
    const { projectId, files, assets, path } = e.data
    const channel = new MessageChannel()
    const stored = new Promise(resolve => { channel.port1.onmessage = resolve })
    try {
      reg.active!.postMessage({ projectId, files, assets }, [channel.port2])
    } catch (err) {
      fail(err)
      return
    }
    // A worker that never answers would leave the Preview blank for good.
    const late = setTimeout(() => fail(new Error("The Service Worker didn't store the files within 10 s.")), 10_000)
    stored.then(() => {
      clearTimeout(late)
      location.replace('/preview/' + projectId + '/' + path)
    })
  })
  // helper.js is a static file and can't read VITE_APP_ORIGIN; the Prototype pages share this frame's sessionStorage.
  sessionStorage.setItem('scrabby-app-origin', APP)
  tell('ready')
}

start().catch(fail)
