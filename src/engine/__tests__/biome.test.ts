import { describe, it, expect } from 'vitest'
import { generateBiomeMap, getBiome, biomeMap } from '../biome'

describe('biome', () => {
  it('generateBiomeMap fills map with valid biome IDs', () => {
    generateBiomeMap(42)
    for (let i = 0; i < biomeMap.length; i++) {
      expect(biomeMap[i]).toBeGreaterThanOrEqual(0)
      expect(biomeMap[i]).toBeLessThanOrEqual(3)
    }
  })

  it('getBiome returns valid ID for all world positions', () => {
    generateBiomeMap(99)
    // Sample corners and center
    const positions = [[0,0],[999,999],[0,999],[999,0],[500,500],[250,750]]
    for (const [x, y] of positions) {
      const b = getBiome(x, y)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(3)
    }
  })

  it('getBiome clamps out-of-bounds coordinates', () => {
    generateBiomeMap(1)
    expect(() => getBiome(-100, -100)).not.toThrow()
    expect(() => getBiome(2000, 2000)).not.toThrow()
  })

  it('same seed produces same biome map', () => {
    generateBiomeMap(777)
    const snap1 = new Uint8Array(biomeMap)
    generateBiomeMap(777)
    const snap2 = new Uint8Array(biomeMap)
    expect(snap1).toEqual(snap2)
  })

  it('different seeds produce different maps', () => {
    generateBiomeMap(1)
    const snap1 = new Uint8Array(biomeMap)
    generateBiomeMap(2)
    const snap2 = new Uint8Array(biomeMap)
    let diff = 0
    for (let i = 0; i < snap1.length; i++) if (snap1[i] !== snap2[i]) diff++
    expect(diff).toBeGreaterThan(100)
  })
})
