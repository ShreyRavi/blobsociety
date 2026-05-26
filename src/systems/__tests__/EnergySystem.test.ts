import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { EnergySystem } from '../EnergySystem'
import type { SimEngine } from '../../engine/SimEngine'

function makeBuffers(setup: (w: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

describe('EnergySystem', () => {
  it('drains energy by metabolism', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 80
      b.metabolism[0] = 0.5
    })
    EnergySystem.update(read, write, {} as SimEngine)
    expect(write.energy[0]).toBeCloseTo(79.5)
  })

  it('clamps energy to [0,100]', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 0.1
      b.metabolism[0] = 1.0
    })
    EnergySystem.update(read, write, {} as SimEngine)
    expect(write.energy[0]).toBe(0)
  })

  it('updates hunger correctly', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.energy[0] = 60
      b.metabolism[0] = 0
    })
    EnergySystem.update(read, write, {} as SimEngine)
    expect(write.hunger[0]).toBeCloseTo(0.4)
  })

  it('skips dead blobs', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 0
      b.energy[0] = 80
      b.metabolism[0] = 5
    })
    write.energy[0] = 80
    EnergySystem.update(read, write, {} as SimEngine)
    expect(write.energy[0]).toBe(80)
  })
})
