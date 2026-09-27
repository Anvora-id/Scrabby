import { describe, expect, it } from 'vitest'
import { blockInfo, blockMarks, changedLines, findBlockCode, newFileProblem, tabOrder } from './code.ts'
import { builtSite } from '../fixtures/fixtures.ts'

const { project, checkpoints } = builtSite()
const [cp1, cp2] = checkpoints

describe('changedLines', () => {
  it('finds new and changed lines', () => {
    expect(changedLines('a\nb\nc', 'a\nb\nc')).toEqual([])
    expect(changedLines('a\nb\nc', 'a\nB\nc')).toEqual([2])
    expect(changedLines('a\nc', 'a\nb1\nb2\nc')).toEqual([2, 3])
  })

  it('adds nothing for a pure deletion', () => {
    expect(changedLines('a\nb\nc', 'a\nc')).toEqual([])
  })

  it('marks every line without a base', () => {
    expect(changedLines(undefined, 'a\nb\nc')).toEqual([1, 2, 3])
  })

  it('finds the 4 Opening hours lines of the last Build', () => {
    const text = project.files['index.html']
    const found = changedLines(cp2.files['index.html'], text).map(n => text.split('\n')[n - 1].trim())
    expect(found).toEqual(['<section class="hours" data-block="' + hoursId() + '">', '<h2>Opening hours</h2>', '<p>Saturdays 9 till 1, at the school gate</p>', '</section>'])
  })

  it('finds nothing on menu.html', () => {
    expect(changedLines(cp2.files['menu.html'], project.files['menu.html'])).toEqual([])
  })
})

function hoursId(): string {
  return Object.values(cp2.canvas.blocks).find(b => b.name === 'Opening hours')!.id
}

describe('blockMarks', () => {
  it('gives the first line of each Block, first time only, in order', () => {
    expect(blockMarks('<a data-block="b1">\n<b data-block="b2"><i data-block="b3">\n<a data-block="b1">')).toEqual([
      { line: 1, id: 'b1' }, { line: 2, id: 'b2' }, { line: 2, id: 'b3' },
    ])
  })
})

describe('findBlockCode', () => {
  it('prefers the HTML mark', () => {
    const files = { 'style.css': '/* block b2 */\n.x {}', 'index.html': '<p>\n<b data-block="b2">' }
    expect(findBlockCode(files, 'b2')).toEqual({ file: 'index.html', line: 2 })
  })

  it('falls back to the CSS comment', () => {
    const files = { 'index.html': '<p>', 'style.css': 'body {}\n\n/* block b2 */\n.x {}' }
    expect(findBlockCode(files, 'b2')).toEqual({ file: 'style.css', line: 3 })
    expect(findBlockCode(files, 'b9')).toBeUndefined()
  })
})

describe('blockInfo', () => {
  it('reads Blocks gone from the Project from the newest Checkpoint', () => {
    expect(blockInfo(hoursId(), project, checkpoints)).toEqual({ name: 'Opening hours', category: 'ui' })
    const hero = Object.values(cp1.canvas.blocks).find(b => b.type === 'hero')!
    expect(project.blocks[hero.id]).toBeUndefined()
    expect(blockInfo(hero.id, project, checkpoints)).toEqual({ name: 'Big welcome', category: 'ui' })
  })

  it('reads a Built page on the Canvas', () => {
    const home = Object.values(project.blocks).find(b => b.file === 'index.html')!
    expect(blockInfo(home.id, project, checkpoints)).toEqual({ name: 'Home', category: 'pages' })
  })

  it('gives Instances the my category', () => {
    const inst = Object.values(cp1.canvas.blocks).find(b => b.inst)!
    expect(blockInfo(inst.id, project, checkpoints)?.category).toBe('my')
  })

  it('knows no canvas and no unknown ids', () => {
    expect(blockInfo('canvas', project, checkpoints)).toBeUndefined()
    expect(blockInfo('b999', project, checkpoints)).toBeUndefined()
  })
})

describe('newFileProblem', () => {
  const files = { 'index.html': '', 'styles.css': '' }
  const bad = 'Use a name like about.html, extra.css or games.js.'

  it('accepts a new html, css or js name', () => {
    for (const n of ['about.html', 'extra.css', 'games.js', '2nd-page.html']) expect(newFileProblem(n, files)).toBeNull()
  })

  it('rejects other names', () => {
    for (const n of ['', 'about', 'about.txt', '-a.html', 'my page.html', 'a/b.html', '.builds/x.html', 'About.html']) expect(newFileProblem(n, files)).toBe(bad)
  })

  it('rejects a taken name', () => {
    expect(newFileProblem('index.html', files)).toBe('index.html already exists.')
  })
})

describe('tabOrder', () => {
  it('puts index.html first, then html, css and js', () => {
    expect(tabOrder(['base.css', 'style.css', 'script.js', 'quiz.html', 'index.html', 'menu.html']))
      .toEqual(['index.html', 'menu.html', 'quiz.html', 'base.css', 'style.css', 'script.js'])
  })
})
