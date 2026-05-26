import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { PHERO_FOOD } from '../engine/PheromoneGrid'
import { DIET_CARNIVORE, WORLD_W, WORLD_H } from '../engine/constants'

export const FoodSystem: System = {
  name: 'FoodSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    const { foodPool, pheromone } = engine
    const food = foodPool

    forEachAlive(read, (i) => {
      // Carnivores don't forage for plant food (they hunt)
      if (read.diet[i] === DIET_CARNIVORE) return

      const vr = read.visionRadius[i]
      const bx = read.x[i]
      const by = read.y[i]
      let bestDist = vr * vr
      let bestFood = -1

      // Scan all food (simple O(MAX_FOOD_COUNT) scan — spatial hash used for blobs)
      for (let f = 0; f < food.alive.length; f++) {
        if (!food.alive[f]) continue
        const dx = food.x[f] - bx
        const dy = food.y[f] - by
        const d2 = dx * dx + dy * dy
        if (d2 < bestDist) {
          bestDist = d2
          bestFood = f
        }
      }

      if (bestFood !== -1) {
        const gained = food.consume(bestFood)
        write.energy[i] = Math.min(100, write.energy[i] + gained)
        // Deposit food pheromone
        pheromone.deposit(bx, by, PHERO_FOOD, 0.5)
      }
    })

    // Spawn new food this tick
    const { prng } = engine
    const spawnCount = Math.floor(engine.baseFoodSpawnRate * engine.worldEventFoodMod)
    for (let s = 0; s < spawnCount; s++) {
      if (food.count >= food.alive.length) break
      const fx = prng.nextRange(0, WORLD_W)
      const fy = prng.nextRange(0, WORLD_H)
      const fv = prng.nextRange(5, 30)
      food.spawn(fx, fy, fv)
    }
  },
}

