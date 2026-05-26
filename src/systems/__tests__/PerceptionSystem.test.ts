import { describe, it, expect, beforeEach } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { SpatialHash } from '../../engine/SpatialHash'
import { PerceptionSystem, neighborCounts, neighborLists } from '../PerceptionSystem'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(): SimEngine {
  return { spatialHash: SpatialHash } as unknown as SimEngine
}

beforeEach(() => {
  SpatialHash.clear()
})

describe('PerceptionSystem', () => {
  it('counts one neighbor when two blobs are within vision radius', () => {
    const read = new StateBuffer()
    read.alive[0] = 1; read.alive[1] = 1; read.count = 2
    read.x[0] = 100; read.y[0] = 100; read.visionRadius[0] = 80
    read.x[1] = 110; read.y[1] = 100  // 10 units away, within 80

    SpatialHash.insert(0, 100, 100)
    SpatialHash.insert(1, 110, 100)

    PerceptionSystem.update(read, new StateBuffer(), fakeEngine())

    expect(neighborCounts[0]).toBe(1)
    expect(neighborLists[0][0]).toBe(1)
  })

  it('excludes self from neighbor list', () => {
    const read = new StateBuffer()
    read.alive[0] = 1; read.count = 1
    read.x[0] = 100; read.y[0] = 100; read.visionRadius[0] = 80

    SpatialHash.insert(0, 100, 100)

    PerceptionSystem.update(read, new StateBuffer(), fakeEngine())

    expect(neighborCounts[0]).toBe(0)
  })

  it('excludes blobs outside vision radius', () => {
    const read = new StateBuffer()
    read.alive[0] = 1; read.alive[1] = 1; read.count = 2
    read.x[0] = 100; read.y[0] = 100; read.visionRadius[0] = 20
    read.x[1] = 200; read.y[1] = 200  // ~141 units away, outside 20

    SpatialHash.insert(0, 100, 100)
    SpatialHash.insert(1, 200, 200)

    PerceptionSystem.update(read, new StateBuffer(), fakeEngine())

    expect(neighborCounts[0]).toBe(0)
  })

  it('excludes dead blobs from neighbor list', () => {
    const read = new StateBuffer()
    read.alive[0] = 1; read.alive[1] = 0; read.count = 1
    read.x[0] = 100; read.y[0] = 100; read.visionRadius[0] = 80
    read.x[1] = 110; read.y[1] = 100

    SpatialHash.insert(0, 100, 100)
    SpatialHash.insert(1, 110, 100)

    PerceptionSystem.update(read, new StateBuffer(), fakeEngine())

    expect(neighborCounts[0]).toBe(0)
  })

  it('counts multiple neighbors correctly', () => {
    const read = new StateBuffer()
    for (let i = 0; i < 4; i++) {
      read.alive[i] = 1
      read.x[i] = 100 + i * 5  // all within 30 of blob 0
      read.y[i] = 100
    }
    read.count = 4
    read.visionRadius[0] = 30

    for (let i = 0; i < 4; i++) SpatialHash.insert(i, read.x[i], read.y[i])

    PerceptionSystem.update(read, new StateBuffer(), fakeEngine())

    expect(neighborCounts[0]).toBe(3)  // 3 others within radius
  })
})
