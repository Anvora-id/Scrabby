import { describe, expect, it } from 'vitest'
import { aimStep } from './drag.ts'
import type { Aim } from './drag.ts'

const block = { kind: 'block', id: 'b' } as const
const trait = { kind: 'newTrait', type: 'color' } as const
const none: Aim = { target: null, trash: false }
const inHome: Aim = { target: { id: 'home', slot: null }, trash: false }
const inHero: Aim = { target: { id: 'hero', slot: null }, trash: false }
const trash: Aim = { target: null, trash: true }
const no = () => false

describe('aimStep', () => {
  it('keeps the same spot without asking about the hold', () => {
    expect(aimStep(block, inHome, inHome, () => { throw new Error('asked') })).toBe('keep')
  })

  it('keeps a chosen spot while the pointer is near it', () => {
    expect(aimStep(block, inHome, inHero, () => true)).toBe('keep')
    expect(aimStep(block, trash, inHome, () => true)).toBe('keep')
  })

  it('has nothing to hold when nothing was chosen', () => {
    expect(aimStep(block, none, inHome, () => true)).toBe('wait')
  })

  it('waits for the pointer to rest before a Block gap moves', () => {
    expect(aimStep(block, inHome, inHero, no)).toBe('wait')
    expect(aimStep(block, inHome, none, no)).toBe('wait')
  })

  it('moves a Trait spot at once', () => {
    expect(aimStep(trait, inHome, inHero, no)).toBe('now')
  })

  it('turns the palette delete on and off at once', () => {
    expect(aimStep(block, inHome, trash, no)).toBe('now')
    expect(aimStep(block, trash, inHome, no)).toBe('now')
  })
})
