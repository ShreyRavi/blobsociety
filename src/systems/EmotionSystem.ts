import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { neighborLists, neighborCounts } from './PerceptionSystem'
import { PHERO_DANGER, PHERO_FOOD } from '../engine/PheromoneGrid'
import { DIET_CARNIVORE, DIET_SCAVENGER } from '../engine/constants'

export const EmotionSystem: System = {
  name: 'EmotionSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    const { pheromone } = engine

    forEachAlive(read, (i) => {
      const nc = neighborCounts[i]
      const x = read.x[i]
      const y = read.y[i]

      // Count predator neighbors (carnivore/scavenger stronger than self)
      let threatCount = 0
      let totalNeighborStrength = 0
      for (let k = 0; k < nc; k++) {
        const j = neighborLists[i][k]
        const d = read.diet[j]
        if ((d === DIET_CARNIVORE || d === DIET_SCAVENGER) && read.strength[j] > read.strength[i]) {
          threatCount++
        }
        totalNeighborStrength += read.strength[j]
      }
      const avgNeighborStrength = nc > 0 ? totalNeighborStrength / nc : read.strength[i]

      const dangerPhero = pheromone.sample(x, y, PHERO_DANGER)
      const foodPhero = pheromone.sample(x, y, PHERO_FOOD)

      // Fear: trait baseline + threat count + danger pheromone + starvation panic
      const targetFear = Math.max(0, Math.min(1,
        read.traitFear[i] * 0.3
        + threatCount * 0.15
        + dangerPhero * 0.35
        + (read.hunger[i] > 0.8 ? 0.15 : 0),
      ))
      write.emotionFear[i] = write.emotionFear[i] * 0.8 + targetFear * 0.2

      // Confidence: relative strength vs neighbors, energy level
      const targetConfidence = Math.max(0, Math.min(1,
        0.5 + (read.strength[i] - avgNeighborStrength) * 0.4
        + (read.energy[i] / 100) * 0.25,
      ))
      write.emotionConfidence[i] = write.emotionConfidence[i] * 0.85 + targetConfidence * 0.15

      // Stress: hunger + threat proximity + low energy
      const targetStress = Math.max(0, Math.min(1,
        read.hunger[i] * 0.35
        + threatCount * 0.1
        + (read.energy[i] < 25 ? 0.4 : 0)
        + dangerPhero * 0.15,
      ))
      write.emotionStress[i] = write.emotionStress[i] * 0.8 + targetStress * 0.2

      // Curiosity: trait + low food pheromone means unexplored territory
      const targetCuriosity = Math.max(0, Math.min(1,
        read.traitCuriosity[i] * 0.55 + (1 - foodPhero) * 0.25,
      ))
      write.emotionCuriosity[i] = write.emotionCuriosity[i] * 0.9 + targetCuriosity * 0.1
    })
  },
}
