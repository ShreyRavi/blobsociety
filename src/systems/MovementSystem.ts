import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { WORLD_W, WORLD_H } from '../engine/constants'
import { BIOME_SPEED_MOD, getBiome } from '../engine/biome'

export const MovementSystem: System = {
  name: 'MovementSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, _engine: SimEngine): void {
    forEachAlive(read, (i) => {
      let vx = write.vx[i]
      let vy = write.vy[i]

      // NaN guard
      if (!isFinite(vx)) vx = 0
      if (!isFinite(vy)) vy = 0

      const biome = getBiome(read.x[i], read.y[i])
      const speedMod = BIOME_SPEED_MOD[biome] ?? 1.0
      const speed = read.speed[i]

      let nx = read.x[i] + vx * speed * speedMod
      let ny = read.y[i] + vy * speed * speedMod

      // Bounce on world edges
      if (nx < 0) { nx = -nx; vx = -vx }
      if (nx > WORLD_W) { nx = 2 * WORLD_W - nx; vx = -vx }
      if (ny < 0) { ny = -ny; vy = -vy }
      if (ny > WORLD_H) { ny = 2 * WORLD_H - ny; vy = -vy }

      // Clamp (safety net after bounce)
      write.x[i] = Math.max(0, Math.min(WORLD_W, nx))
      write.y[i] = Math.max(0, Math.min(WORLD_H, ny))
      write.vx[i] = vx
      write.vy[i] = vy
    })
  },
}
