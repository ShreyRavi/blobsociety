import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'

export const EnergySystem: System = {
  name: 'EnergySystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, _engine: SimEngine): void {
    forEachAlive(read, (i) => {
      write.energy[i] -= read.metabolism[i]
      write.energy[i] = Math.max(0, Math.min(100, write.energy[i]))
      write.hunger[i] = 1 - write.energy[i] / 100
    })
  },
}
