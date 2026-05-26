import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'

export const PheromoneSystem: System = {
  name: 'PheromoneSystem',
  enabled: true,

  update(_read: StateBuffer, _write: StateBuffer, engine: SimEngine, phase?: string): void {
    if (phase === 'diffuse') {
      // Spread existing pheromones from read buffer into write buffer
      engine.pheromone.diffuse()
    } else if (phase === 'deposit') {
      // Individual systems have deposited into write buffer; commit for next tick
      engine.pheromone.swap()
    }
  },
}
