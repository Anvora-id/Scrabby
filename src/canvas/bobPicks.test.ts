import { describe, expect, it } from 'vitest'
import { demoProject } from '../fixtures/fixtures.ts'
import { addTrait } from '../model/project.ts'
import type { Project } from '../model/types.ts'
import { bobPicksControl, setBobPicks } from './bobPicks.ts'

function demo(): Project {
  return demoProject()
}

describe('bobPicks', () => {
  it('tellbob → null', () => {
    expect(bobPicksControl('tellbob', 'anything')).toBeNull()
  })

  it('letbobpick → null', () => {
    expect(bobPicksControl('letbobpick', '')).toBeNull()
  })

  it('color → bulb', () => {
    expect(bobPicksControl('color', '#FF0000')).toBe('bulb')
  })

  it('text empty → bulb', () => {
    expect(bobPicksControl('text', '')).toBe('bulb')
    expect(bobPicksControl('text', '   ')).toBe('bulb')
  })

  it('text non-empty → null', () => {
    expect(bobPicksControl('text', 'Hello')).toBeNull()
  })

  it('fakedata empty → bulb', () => {
    expect(bobPicksControl('fakedata', '')).toBe('bulb')
  })

  it('fakedata non-empty → null', () => {
    expect(bobPicksControl('fakedata', 'some data')).toBeNull()
  })

  it('font → option', () => {
    expect(bobPicksControl('font', 'Nunito')).toBe('option')
  })

  it('vibe → option', () => {
    expect(bobPicksControl('vibe', 'calm')).toBe('option')
  })

  it('onclick → option', () => {
    expect(bobPicksControl('onclick', 'pick one')).toBe('option')
  })

  it('setBobPicks on keeps value and hint', () => {
    const p = demo()
    const tid = addTrait(p, 'text', 'Hello')
    p.traits[tid].note = 'some hint'
    setBobPicks(p, tid, true)
    expect(p.traits[tid].bobPicks).toBe(true)
    expect(p.traits[tid].value).toBe('Hello')
    expect(p.traits[tid].note).toBe('some hint')
  })

  it('setBobPicks off deletes bobPicks, keeps value and note', () => {
    const p = demo()
    const tid = addTrait(p, 'text', 'Hello')
    p.traits[tid].note = 'hint'
    p.traits[tid].bobPicks = true
    setBobPicks(p, tid, false)
    expect(p.traits[tid].bobPicks).toBeUndefined()
    expect(p.traits[tid].value).toBe('Hello')
    expect(p.traits[tid].note).toBe('hint')
  })
})
