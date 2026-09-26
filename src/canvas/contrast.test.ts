import { describe, expect, it } from 'vitest'
import { whiteTextOn } from './contrast.ts'

describe('whiteTextOn', () => {
  it('dark colors get white text', () => {
    expect(whiteTextOn('#111111')).toBe(true)
    expect(whiteTextOn('#1E3A5F')).toBe(true)
  })

  it('light colors keep --ink, pure yellow too', () => {
    expect(whiteTextOn('#FFFFFF')).toBe(false)
    expect(whiteTextOn('#FFE066')).toBe(false)
    expect(whiteTextOn('#FFFF00')).toBe(false)
  })

  it('reads lowercase hex; anything else keeps --ink', () => {
    expect(whiteTextOn('#1e3a5f')).toBe(true)
    expect(whiteTextOn('')).toBe(false)
    expect(whiteTextOn('navy')).toBe(false)
  })
})
