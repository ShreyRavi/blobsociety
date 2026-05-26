import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { BiomeSystem } from '../BiomeSystem'
import {
  biomeMap,
  biomeIndex,
  BIOME_ENERGY_DELTA,
  BIOME_GRASSLAND,
  BIOME_FOREST,
  BIOME_DESERT,
  BIOME_TOXIC,
} from '../../engine/biome'
import type { SimEngine } from '../../engine/SimEngine'

const fakeEngine = {} as unknown as SimEngine

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

function setAt(x: number, y: number, biome: number): void {
  biomeMap[biomeIndex(x, y)] = biome
}

describe('BiomeSystem', () => {
  it('grassland: no energy delta (0)', () => {
    const x = 100; const y = 100
    setAt(x, y, BIOME_GRASSLAND)
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = x; b.y[0] = y
      b.energy[0] = 50
    })
    write.x[0] = x; write.y[0] = y; write.energy[0] = 50

    BiomeSystem.update(read, write, fakeEngine)

    expect(write.energy[0]).toBeCloseTo(50 + BIOME_ENERGY_DELTA[BIOME_GRASSLAND])
  })

  it('forest: positive energy delta', () => {
    const x = 200; const y = 200
    setAt(x, y, BIOME_FOREST)
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = x; b.y[0] = y
      b.energy[0] = 50
    })
    write.x[0] = x; write.y[0] = y; write.energy[0] = 50

    BiomeSystem.update(read, write, fakeEngine)

    expect(write.energy[0]).toBeGreaterThan(50)
    expect(write.energy[0]).toBeCloseTo(50 + BIOME_ENERGY_DELTA[BIOME_FOREST])
  })

  it('desert: negative energy delta', () => {
    const x = 300; const y = 300
    setAt(x, y, BIOME_DESERT)
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = x; b.y[0] = y
      b.energy[0] = 50
    })
    write.x[0] = x; write.y[0] = y; write.energy[0] = 50

    BiomeSystem.update(read, write, fakeEngine)

    expect(write.energy[0]).toBeLessThan(50)
    expect(write.energy[0]).toBeCloseTo(50 + BIOME_ENERGY_DELTA[BIOME_DESERT])
  })

  it('toxic: most negative energy delta', () => {
    const x = 400; const y = 400
    setAt(x, y, BIOME_TOXIC)
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = x; b.y[0] = y
      b.energy[0] = 50
    })
    write.x[0] = x; write.y[0] = y; write.energy[0] = 50

    BiomeSystem.update(read, write, fakeEngine)

    expect(write.energy[0]).toBeCloseTo(50 + BIOME_ENERGY_DELTA[BIOME_TOXIC])
    expect(BIOME_ENERGY_DELTA[BIOME_TOXIC]).toBeLessThan(BIOME_ENERGY_DELTA[BIOME_DESERT])
  })

  it('dead blobs not affected', () => {
    const x = 100; const y = 100
    setAt(x, y, BIOME_FOREST)
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 0; b.count = 0
      b.x[0] = x; b.y[0] = y
      b.energy[0] = 50
    })
    write.x[0] = x; write.y[0] = y; write.energy[0] = 50

    BiomeSystem.update(read, write, fakeEngine)

    expect(write.energy[0]).toBe(50)
  })
})
