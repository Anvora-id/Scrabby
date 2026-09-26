import { describe, expect, it } from 'vitest'
import { HELPER, NO_FILE_TEXT, answer, injectHelper, toEntries } from './serve.ts'

function served(files: Record<string, string>, assets: { path: string; blob: Blob }[] = []) {
  const map = new Map(toEntries('p1', files, assets))
  return (path: string) => answer(path, async key => map.get(key)?.clone())
}

describe('serve', () => {
  it('puts the helper first in head', () => {
    expect(injectHelper('<html><HEAD lang="x"><title>t</title></head></html>'))
      .toBe(`<html><HEAD lang="x">${HELPER}<title>t</title></head></html>`)
    expect(injectHelper('<header>no head</header>')).toBe(HELPER + '<header>no head</header>')
  })

  it('prepends the helper when there is no head', () => {
    expect(injectHelper('<p>hi</p>')).toBe(HELPER + '<p>hi</p>')
  })

  it('serves index.html for a folder', async () => {
    const r = await served({ 'index.html': '<head></head>home' })('/preview/p1/')
    expect(r!.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(await r!.text()).toBe(`<head>${HELPER}</head>home`)
  })

  it('gives CSS and JS their types', async () => {
    const serve = served({ 'style.css': 'a{}', 'script.js': 'x()' })
    const css = await serve('/preview/p1/style.css')
    const js = await serve('/preview/p1/script.js')
    expect(css!.headers.get('content-type')).toBe('text/css; charset=utf-8')
    expect(await css!.text()).toBe('a{}')
    expect(js!.headers.get('content-type')).toBe('text/javascript; charset=utf-8')
  })

  it('serves an Asset Blob with its own type', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const r = await served({}, [{ path: 'assets/my cake.png', blob }])('/preview/p1/assets/my%20cake.png')
    expect(r!.headers.get('content-type')).toBe('image/png')
    expect(await r!.text()).toBe('png')
  })

  it('answers a missing page with the no-file text, the helper and the html type', async () => {
    const r = await served({})('/preview/p1/menu.html')
    expect(r!.status).toBe(404)
    expect(r!.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const text = await r!.text()
    expect(text.startsWith(HELPER)).toBe(true)
    expect(text).toContain(NO_FILE_TEXT)
  })

  it('answers other missing files with 404', async () => {
    const r = await served({})('/preview/p1/nope.css')
    expect(r!.status).toBe(404)
    expect(await r!.text()).toBe('Not found')
  })

  it('leaves other paths alone', async () => {
    const serve = served({ 'index.html': 'x' })
    expect(await serve('/helper.js')).toBeUndefined()
    expect(await serve('/preview/p1')).toBeUndefined()
  })
})
