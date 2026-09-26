import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { zipDownload } from './download.ts'

describe('zipDownload', () => {
  const files = {
    'index.html': '<h1 data-block="b2">Hi</h1>',
    'style.css': 'h1 {}',
    'script.js': '',
    '.builds/build-2.md': 'Second plan\n',
    '.builds/build-10.md': 'Tenth plan',
    '.builds/build-1.md': 'First plan',
  }
  const out = unzipSync(zipDownload(
    { files },
    [{ file: 'cat.png', data: new Uint8Array([1, 2, 3]) }],
  ))

  it('puts the code at the top and leaves out .builds/', () => {
    expect(strFromU8(out['index.html'])).toBe(files['index.html'])
    expect(out['style.css']).toBeDefined()
    expect(out['script.js']).toBeDefined()
    expect(Object.keys(out).some(k => k.startsWith('.builds/'))).toBe(false)
  })

  it('puts Assets under assets/', () => {
    expect([...out['assets/cat.png']]).toEqual([1, 2, 3])
  })

  it('adds nothing else', () => {
    expect(Object.keys(out).sort()).toEqual(['assets/cat.png', 'index.html', 'script.js', 'style.css'])
  })
})
