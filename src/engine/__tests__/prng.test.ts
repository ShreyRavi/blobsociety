import { describe, it, expect } from 'vitest'
import { PRNG } from '../prng'

describe('PRNG', () => {
  it('produces deterministic output for same seed', () => {
    const a = new PRNG(12345)
    const b = new PRNG(12345)
    for (let i = 0; i < 50; i++) {
      expect(a.nextFloat()).toBe(b.nextFloat())
    }
  })

  it('nextFloat returns values in [0,1)', () => {
    const p = new PRNG(42)
    for (let i = 0; i < 200; i++) {
      const v = p.nextFloat()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('nextRange returns values in [min,max)', () => {
    const p = new PRNG(99)
    for (let i = 0; i < 200; i++) {
      const v = p.nextRange(5, 20)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThan(20)
    }
  })

  it('nextGaussian returns reasonable values for standard normal', () => {
    const p = new PRNG(7)
    let sum = 0
    const N = 1000
    for (let i = 0; i < N; i++) sum += p.nextGaussian(0, 1)
    const mean = sum / N
    expect(Math.abs(mean)).toBeLessThan(0.15)  // within 3σ / sqrt(N)
  })

  it('serialize/restore state gives identical sequence', () => {
    const p = new PRNG(555)
    for (let i = 0; i < 100; i++) p.next()
    const state = p.serializeState()

    const vals1: number[] = []
    for (let i = 0; i < 20; i++) vals1.push(p.nextFloat())

    p.restoreState(state)
    const vals2: number[] = []
    for (let i = 0; i < 20; i++) vals2.push(p.nextFloat())

    expect(vals1).toEqual(vals2)
  })

  it('different seeds produce different sequences', () => {
    const a = new PRNG(1)
    const b = new PRNG(2)
    let same = 0
    for (let i = 0; i < 20; i++) {
      if (a.nextFloat() === b.nextFloat()) same++
    }
    expect(same).toBeLessThan(3)
  })
})
