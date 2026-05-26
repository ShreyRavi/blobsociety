import { describe, it, expect } from 'vitest'
import { StateBuffer, forEachAlive } from '../StateBuffer'
import { MAX_BLOB_COUNT } from '../constants'

describe('StateBuffer', () => {
  it('initializes with correct sizes and count=0', () => {
    const buf = new StateBuffer()
    expect(buf.x.length).toBe(MAX_BLOB_COUNT)
    expect(buf.alive.length).toBe(MAX_BLOB_COUNT)
    expect(buf.count).toBe(0)
  })

  it('copyFrom copies all fields', () => {
    const a = new StateBuffer()
    a.x[0] = 123.4
    a.y[0] = 56.7
    a.energy[0] = 88
    a.alive[0] = 1
    a.count = 1

    const b = new StateBuffer()
    b.copyFrom(a)
    expect(b.x[0]).toBe(a.x[0])
    expect(b.y[0]).toBe(a.y[0])
    expect(b.energy[0]).toBe(a.energy[0])
    expect(b.alive[0]).toBe(1)
    expect(b.count).toBe(1)
  })

  it('copyFrom is independent (mutations do not cross)', () => {
    const a = new StateBuffer()
    a.x[0] = 10
    a.alive[0] = 1
    a.count = 1
    const b = new StateBuffer()
    b.copyFrom(a)

    b.x[0] = 999
    expect(a.x[0]).toBe(10)  // a unchanged
  })
})

describe('forEachAlive', () => {
  it('visits only alive blobs', () => {
    const buf = new StateBuffer()
    buf.alive[2] = 1
    buf.alive[5] = 1
    buf.alive[7] = 1

    const visited: number[] = []
    forEachAlive(buf, (i) => { visited.push(i) })
    expect(visited).toEqual([2, 5, 7])
  })

  it('short-circuits on false return', () => {
    const buf = new StateBuffer()
    buf.alive[0] = 1
    buf.alive[1] = 1
    buf.alive[2] = 1

    const visited: number[] = []
    forEachAlive(buf, (i) => {
      visited.push(i)
      if (i === 1) return false
    })
    expect(visited).toEqual([0, 1])
  })

  it('handles empty buffer', () => {
    const buf = new StateBuffer()
    const visited: number[] = []
    forEachAlive(buf, (i) => { visited.push(i) })
    expect(visited).toHaveLength(0)
  })
})
