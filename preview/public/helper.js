// Runs inside every Prototype page; talks to the app (the parent) with paths and error texts only.
if (window.parent !== window) {
  const tell = msg => parent.postMessage(msg, '*')

  addEventListener('load', () => tell({ preview: 'page', path: location.pathname }))
  addEventListener('error', e => tell({ preview: 'error', message: e.message, file: e.filename }))
  addEventListener('unhandledrejection', e => tell({ preview: 'error', message: String(e.reason?.message ?? e.reason) }))

  addEventListener('message', e => {
    if (e.source !== parent || e.data?.preview !== 'flash') return
    const run = () => {
      for (const id of e.data.ids) {
        for (const el of document.querySelectorAll(`[data-block="${CSS.escape(id)}"]`)) {
          el.animate(
            [{ outline: '4px solid #FFE14D', outlineOffset: '3px' }, { outline: '4px solid #FFE14D00', outlineOffset: '3px' }],
            { duration: 1500, easing: 'ease-in' },
          )
        }
      }
    }
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', run)
    else run()
  })
}
