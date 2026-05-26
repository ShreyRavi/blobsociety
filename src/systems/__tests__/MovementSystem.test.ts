import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { MovementSystem } from '../MovementSystem'
import type { SimEngine } from '../../engine/SimEngine'

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

describe('MovementSystem', () => {
  it('moves blob in direction of velocity', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 500; b.y[0] = 500
      b.vx[0] = 1; b.vy[0] = 0
      b.speed[0] = 1.0
    })
    MovementSystem.update(read, write, {} as SimEngine)
    expect(write.x[0]).toBeGreaterThan(500)
    expect(write.y[0]).toBeCloseTo(500)
  })

  it('bounces off left wall', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 2; b.y[0] = 500
      b.vx[0] = -1; b.vy[0] = 0
      b.speed[0] = 5
    })
    MovementSystem.update(read, write, {} as SimEngine)
    expect(write.x[0]).toBeGreaterThanOrEqual(0)
    expect(write.vx[0]).toBeGreaterThan(0)
  })

  it('bounces off right wall', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 998; b.y[0] = 500
      b.vx[0] = 1; b.vy[0] = 0
      b.speed[0] = 5
    })
    MovementSystem.update(read, write, {} as SimEngine)
    expect(write.x[0]).toBeLessThanOrEqual(1000)
    expect(write.vx[0]).toBeLessThan(0)
  })

  it('guards NaN velocity', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 500; b.y[0] = 500
      b.speed[0] = 1
    })
    write.vx[0] = NaN
    write.vy[0] = NaN
    MovementSystem.update(read, write, {} as SimEngine)
    expect(isFinite(write.x[0])).toBe(true)
    expect(isFinite(write.y[0])).toBe(true)
  })

  it('skips dead blobs', () => {
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 0
      b.x[0] = 500; b.y[0] = 500
    })
    write.vx[0] = 1; write.vy[0] = 1; write.speed[0] = 5
    MovementSystem.update(read, write, {} as SimEngine)
    expect(write.x[0]).toBe(500)
  })
})
