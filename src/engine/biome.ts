import {
  WORLD_W,
  WORLD_H,
  BIOME_COLS,
  BIOME_ROWS,
  BIOME_GRASSLAND,
  BIOME_FOREST,
  BIOME_DESERT,
  BIOME_TOXIC,
} from './constants'

export const biomeMap = new Uint8Array(BIOME_COLS * BIOME_ROWS)

export function biomeIndex(x: number, y: number): number {
  const cx = Math.floor(Math.max(0, Math.min(WORLD_W - 1, x)) / 4)
  const cy = Math.floor(Math.max(0, Math.min(WORLD_H - 1, y)) / 4)
  return cx + cy * BIOME_COLS
}

export function getBiome(x: number, y: number): number {
  return biomeMap[biomeIndex(x, y)]
}

// Simple noise — inline to avoid dependency on external noise library
function noise2d(x: number, y: number, seed: number): number {
  let n = (x * 1619 + y * 31337 + seed * 1013) & 0x7fffffff
  n = (n >> 13) ^ n
  return 1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0
}

function smoothNoise(x: number, y: number, seed: number): number {
  const corners = (
    noise2d(x - 1, y - 1, seed) +
    noise2d(x + 1, y - 1, seed) +
    noise2d(x - 1, y + 1, seed) +
    noise2d(x + 1, y + 1, seed)
  ) / 16
  const sides = (
    noise2d(x - 1, y, seed) +
    noise2d(x + 1, y, seed) +
    noise2d(x, y - 1, seed) +
    noise2d(x, y + 1, seed)
  ) / 8
  return corners + sides + noise2d(x, y, seed) / 4
}

function octaveNoise(x: number, y: number, seed: number, octaves: number): number {
  let val = 0
  let amp = 1
  let freq = 1
  let max = 0
  for (let o = 0; o < octaves; o++) {
    val += smoothNoise(x * freq, y * freq, seed + o * 31) * amp
    max += amp
    amp *= 0.5
    freq *= 2
  }
  return val / max
}

export function generateBiomeMap(seed: number): void {
  for (let cy = 0; cy < BIOME_ROWS; cy++) {
    for (let cx = 0; cx < BIOME_COLS; cx++) {
      const n = octaveNoise(cx * 0.08, cy * 0.08, seed, 4)
      let biome: number
      if (n < -0.3) biome = BIOME_DESERT
      else if (n < 0.1) biome = BIOME_GRASSLAND
      else if (n < 0.4) biome = BIOME_FOREST
      else biome = BIOME_TOXIC
      biomeMap[cx + cy * BIOME_COLS] = biome
    }
  }
}

export const BIOME_SPEED_MOD = [1.0, 0.7, 1.2, 1.0]  // grassland/forest/desert/toxic
export const BIOME_ENERGY_DELTA = [0, 0.1, -0.15, -0.5]
export const BIOME_FOOD_RATE = [1.0, 2.0, 0.2, 0.5]

export { BIOME_GRASSLAND, BIOME_FOREST, BIOME_DESERT, BIOME_TOXIC }
