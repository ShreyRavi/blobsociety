import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { getBiome, BIOME_ENERGY_DELTA } from '../engine/biome'

export const BiomeSystem: System = {
  name: 'BiomeSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, _engine: SimEngine): void {
    forEachAlive(read, (i) => {
      const biome = getBiome(write.x[i], write.y[i])
      write.energy[i] += BIOME_ENERGY_DELTA[biome] ?? 0
      // Clamp done by EnergySystem after; no double-clamp needed here
    })
  },
}
