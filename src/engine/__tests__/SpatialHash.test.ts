import { describe, it, expect, beforeEach } from 'vitest'
import { SpatialHash } from '../SpatialHash'

beforeEach(() => { SpatialHash.clear() })

describe('SpatialHash', () => {
  it('finds blob in same cell', () => {
    SpatialHash.insert(0, 100, 100)
    SpatialHash.insert(1, 105, 105)
    const { buf, count } = SpatialHash.queryNeighbors(100, 100, 30)
    const ids = Array.from(buf.subarray(0, count))
    expect(ids).toContain(0)
    expect(ids).toContain(1)
  })

  it('returns empty when no blobs inserted', () => {
    const { count } = SpatialHash.queryNeighbors(500, 500, 50)
    expect(count).toBe(0)
  })

  it('queries across cell boundaries', () => {
    // Cell size = 120 (MAX_VISION_RADIUS). Put blobs at 110 and 130 (different cells).
    SpatialHash.insert(0, 110, 110)
    SpatialHash.insert(1, 130, 130)
    const { buf, count } = SpatialHash.queryNeighbors(120, 120, 60)
    const ids = Array.from(buf.subarray(0, count))
    expect(ids).toContain(0)
    expect(ids).toContain(1)
  })

  it('clear removes all entries', () => {
    SpatialHash.insert(0, 50, 50)
    SpatialHash.clear()
    const { count } = SpatialHash.queryNeighbors(50, 50, 200)
    expect(count).toBe(0)
  })

  it('handles edge positions', () => {
    SpatialHash.insert(0, 0, 0)
    SpatialHash.insert(1, 999, 999)
    const { buf: buf1, count: c1 } = SpatialHash.queryNeighbors(0, 0, 30)
    expect(Array.from(buf1.subarray(0, c1))).toContain(0)
    const { buf: buf2, count: c2 } = SpatialHash.queryNeighbors(999, 999, 30)
    expect(Array.from(buf2.subarray(0, c2))).toContain(1)
  })
})
