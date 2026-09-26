import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { zipDownload } from './download.ts'

const SKILL_FILES = ['code-rules', 'layout', 'behavior', 'content', 'visual-style'].map(n => `.bob/skills/${n}/SKILL.md`)

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
    { name: 'Mayas bake sale', files },
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

  it('adds the Bob kit', () => {
    const agents = strFromU8(out['AGENTS.md'])
    expect(agents.startsWith('# Mayas bake sale\n\nA website made with Scrabby.')).toBe(true)
    expect(agents).toContain('## The plan\n\n### Build 1\n\nFirst plan\n\n### Build 2\n\nSecond plan\n\n### Build 10\n\nTenth plan\n')
    for (const f of SKILL_FILES) expect(strFromU8(out[f])).toMatch(/^---\r?\nname: /)
    expect(Object.keys(out).sort()).toEqual(
      ['AGENTS.md', 'assets/cat.png', 'index.html', 'script.js', 'style.css', ...SKILL_FILES].sort(),
    )
  })

  it('says No Build yet. without Builds', () => {
    const agents = strFromU8(unzipSync(zipDownload({ name: 'X', files: {} }, []))['AGENTS.md'])
    expect(agents.endsWith('## The plan\n\nNo Build yet.\n')).toBe(true)
  })
})
