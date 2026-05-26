import { PHERO_W, PHERO_H, PHERO_CHANNELS, PHERO_FOOD, PHERO_DANGER, PHERO_TERRITORY, PHERO_MATING } from './constants'

const SIZE = PHERO_W * PHERO_H * PHERO_CHANNELS

// Decay rates per channel
const DECAY = [0.98, 0.95, 0.97, 0.96]  // food, danger, territory, mating

function idx(x: number, y: number, ch: number): number {
  return (y * PHERO_W + x) * PHERO_CHANNELS + ch
}

export class PheromoneGrid {
  read: Float32Array
  write: Float32Array

  constructor() {
    this.read = new Float32Array(SIZE)
    this.write = new Float32Array(SIZE)
  }

  swap(): void {
    const tmp = this.read
    this.read = this.write
    this.write = tmp
  }

  // Diffuse + decay — runs at start of tick (phase: 'diffuse')
  // Flat loops, no closures — performance critical
  diffuse(): void {
    const src = this.read
    const dst = this.write
    for (let y = 0; y < PHERO_H; y++) {
      for (let x = 0; x < PHERO_W; x++) {
        for (let ch = 0; ch < PHERO_CHANNELS; ch++) {
          let sum = 0
          let n = 0
          // 3×3 Moore neighborhood
          for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy
            if (ny < 0 || ny >= PHERO_H) continue
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx
              if (nx < 0 || nx >= PHERO_W) continue
              sum += src[idx(nx, ny, ch)]
              n++
            }
          }
          dst[idx(x, y, ch)] = (sum / n) * DECAY[ch]
        }
      }
    }
  }

  // Deposit amount to a world-space position (phase: 'deposit')
  deposit(worldX: number, worldY: number, channel: number, amount: number): void {
    const gx = Math.floor(Math.max(0, Math.min(PHERO_W - 1, worldX / 10)))
    const gy = Math.floor(Math.max(0, Math.min(PHERO_H - 1, worldY / 10)))
    this.write[idx(gx, gy, channel)] += amount
  }

  // Sample pheromone at world-space position from read buffer
  sample(worldX: number, worldY: number, channel: number): number {
    const gx = Math.floor(Math.max(0, Math.min(PHERO_W - 1, worldX / 10)))
    const gy = Math.floor(Math.max(0, Math.min(PHERO_H - 1, worldY / 10)))
    return this.read[idx(gx, gy, channel)]
  }

  // Read buffer for overlay rendering
  getReadBuffer(): Float32Array {
    return this.read
  }
}

export { PHERO_FOOD, PHERO_DANGER, PHERO_TERRITORY, PHERO_MATING, PHERO_W, PHERO_H, PHERO_CHANNELS }
