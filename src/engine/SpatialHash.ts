import { MAX_BLOB_COUNT, MAX_VISION_RADIUS, WORLD_W, WORLD_H } from './constants'

const CELL_SIZE = MAX_VISION_RADIUS
const GRID_W = Math.ceil(WORLD_W / CELL_SIZE) + 1  // +1 for boundary blobs
const GRID_H = Math.ceil(WORLD_H / CELL_SIZE) + 1
const GRID_CELLS = GRID_W * GRID_H
const MAX_PER_CELL = MAX_BLOB_COUNT

// Pre-allocated flat storage: each cell holds up to MAX_PER_CELL entries
const cellCount = new Int32Array(GRID_CELLS)
const cellData = new Uint16Array(GRID_CELLS * MAX_PER_CELL)

// Neighbor result buffer (reused per query)
const neighborBuf = new Uint16Array(MAX_BLOB_COUNT * 8)

function cellIndex(cx: number, cy: number): number {
  return cy * GRID_W + cx
}

export const SpatialHash = {
  clear(): void {
    cellCount.fill(0)
  },

  insert(id: number, x: number, y: number): void {
    const cx = Math.floor(x / CELL_SIZE)
    const cy = Math.floor(y / CELL_SIZE)
    const ci = cellIndex(
      Math.max(0, Math.min(GRID_W - 1, cx)),
      Math.max(0, Math.min(GRID_H - 1, cy)),
    )
    const slot = cellCount[ci]
    if (slot < MAX_PER_CELL) {
      cellData[ci * MAX_PER_CELL + slot] = id
      cellCount[ci]++
    }
  },

  // Query all entries within radius r of (x, y).
  // CRITICAL: queries full bounding-box of cells, not just current cell.
  queryNeighbors(x: number, y: number, r: number): { buf: Uint16Array; count: number } {
    const minCx = Math.max(0, Math.floor((x - r) / CELL_SIZE))
    const maxCx = Math.min(GRID_W - 1, Math.ceil((x + r) / CELL_SIZE))
    const minCy = Math.max(0, Math.floor((y - r) / CELL_SIZE))
    const maxCy = Math.min(GRID_H - 1, Math.ceil((y + r) / CELL_SIZE))

    let count = 0
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const ci = cellIndex(cx, cy)
        const n = cellCount[ci]
        const base = ci * MAX_PER_CELL
        for (let k = 0; k < n; k++) {
          const id = cellData[base + k]
          if (count < neighborBuf.length) {
            neighborBuf[count++] = id
          }
        }
      }
    }
    return { buf: neighborBuf, count }
  },
}
