import { describe, expect, it } from 'vitest'
import { emptyProject } from './project.ts'
import {
  addAsset,
  cleanFileName,
  deleteWarning,
  formatBytes,
  removeAsset,
  renameProblem,
  renameAsset,
  renamedFile,
  uploadKind,
} from './library.ts'

describe('uploadKind', () => {
  it('accepts known image types', () => {
    expect(uploadKind({ name: 'a.png', type: 'image/png', size: 100 })).toBe('image')
    expect(uploadKind({ name: 'a.jpg', type: 'image/jpeg', size: 100 })).toBe('image')
    expect(uploadKind({ name: 'a.gif', type: 'image/gif', size: 100 })).toBe('image')
    expect(uploadKind({ name: 'a.webp', type: 'image/webp', size: 100 })).toBe('image')
  })

  it('accepts known video types', () => {
    expect(uploadKind({ name: 'a.mp4', type: 'video/mp4', size: 100 })).toBe('video')
    expect(uploadKind({ name: 'a.webm', type: 'video/webm', size: 100 })).toBe('video')
  })

  it('refuses SVG with the correct text', () => {
    const result = uploadKind({ name: 'icon.svg', type: 'image/svg+xml', size: 100 })
    expect(result).toBe("icon.svg can't go in the Library: it takes png, jpg, gif and webp images, and mp4 and webm videos.")
  })

  it('refuses files over 25 MB with the correct text', () => {
    const size = 30 * 1024 * 1024
    const result = uploadKind({ name: 'big.png', type: 'image/png', size })
    expect(result).toBe('big.png is 30 MB. The Library takes files up to 25 MB.')
  })

  it('refuses unknown types', () => {
    const result = uploadKind({ name: 'data.csv', type: 'text/csv', size: 100 })
    expect(typeof result).toBe('string')
    expect(result).toContain("can't go in the Library")
  })
})

describe('formatBytes', () => {
  it('formats 640 KB', () => {
    expect(formatBytes(640 * 1024)).toBe('640 KB')
  })

  it('formats 1.2 MB', () => {
    expect(formatBytes(Math.round(1.2 * 1024 * 1024))).toBe('1.2 MB')
  })

  it('formats 30 MB', () => {
    expect(formatBytes(30 * 1024 * 1024)).toBe('30 MB')
  })
})

describe('cleanFileName', () => {
  it('My Cat.PNG → my-cat.png', () => {
    expect(cleanFileName('My Cat.PNG')).toBe('my-cat.png')
  })

  it('Été (2).webm → ete-2.webm', () => {
    expect(cleanFileName('Été (2).webm')).toBe('ete-2.webm')
  })

  it('empty result gets file prefix', () => {
    expect(cleanFileName('!!!')).toBe('file')
  })

  it('starts with dot gets file prefix', () => {
    expect(cleanFileName('.hidden')).toBe('file.hidden')
  })
})

describe('addAsset', () => {
  it('assigns sequential ids and normalizes names', () => {
    const p = emptyProject()
    const id1 = addAsset(p, 'My Cat.PNG', { kind: 'image', mime: 'image/png', bytes: 100 })
    expect(id1).toBe('a1')
    expect(p.assets[0].file).toBe('my-cat.png')
    const id2 = addAsset(p, 'my-cat.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    expect(id2).toBe('a2')
    expect(p.assets[1].file).toBe('my-cat-2.png')
  })

  it('handles name clashes with -2, -3', () => {
    const p = emptyProject()
    addAsset(p, 'photo.jpg', { kind: 'image', mime: 'image/jpeg', bytes: 100 })
    addAsset(p, 'photo.jpg', { kind: 'image', mime: 'image/jpeg', bytes: 100 })
    addAsset(p, 'photo.jpg', { kind: 'image', mime: 'image/jpeg', bytes: 100 })
    expect(p.assets[0].file).toBe('photo.jpg')
    expect(p.assets[1].file).toBe('photo-2.jpg')
    expect(p.assets[2].file).toBe('photo-3.jpg')
  })
})

describe('rename', () => {
  it('renamedFile cleans and preserves extension', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    expect(renamedFile(p, 'a1', 'My Photo')).toBe('my-photo.png')
  })

  it('renamedFile adds original extension when typed has none', () => {
    const p = emptyProject()
    addAsset(p, 'video.mp4', { kind: 'video', mime: 'video/mp4', bytes: 100 })
    expect(renamedFile(p, 'a1', 'my video')).toBe('my-video.mp4')
  })

  it('renameProblem returns null when no clash', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    expect(renameProblem(p, 'a1', 'other-name')).toBeNull()
  })

  it('renameProblem returns message when another asset has that file', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    addAsset(p, 'other.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    const result = renameProblem(p, 'a2', 'photo')
    expect(result).toBe('photo.png is already in the Library')
  })

  it('renameAsset sets the new file name', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    renameAsset(p, 'a1', 'new-name')
    expect(p.assets[0].file).toBe('new-name.png')
  })
})

describe('removeAsset', () => {
  it('removes from assets array', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    removeAsset(p, 'a1')
    expect(p.assets).toHaveLength(0)
  })
})

describe('deleteWarning', () => {
  it('with no users: generic text', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    const msg = deleteWarning(p, 'a1')
    expect(msg).toBe('Delete photo.png? Any code using it will break. You can ask the Assistant to fix the references.')
  })

  it('with 1 user: Trait count and name', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    const siteId = p.blocks['canvas'].children[0]
    // add a trait referencing this asset
    const t1 = `t${p.next.t++}`
    p.traits[t1] = { id: t1, type: 'image', value: 'a1', note: '' }
    p.blocks[siteId].traits.push(t1)
    const msg = deleteWarning(p, 'a1')
    expect(msg).toContain('1 Trait (My website › image)')
    expect(msg).toContain('Delete photo.png?')
  })

  it('with 2 users: plural Traits', () => {
    const p = emptyProject()
    addAsset(p, 'photo.png', { kind: 'image', mime: 'image/png', bytes: 100 })
    const siteId = p.blocks['canvas'].children[0]
    const t1 = `t${p.next.t++}`
    p.traits[t1] = { id: t1, type: 'image', value: 'a1', note: '' }
    p.blocks[siteId].traits.push(t1)
    const t2 = `t${p.next.t++}`
    p.traits[t2] = { id: t2, type: 'video', value: 'a1', note: '' }
    p.blocks[siteId].traits.push(t2)
    const msg = deleteWarning(p, 'a1')
    expect(msg).toContain('2 Traits')
  })
})
