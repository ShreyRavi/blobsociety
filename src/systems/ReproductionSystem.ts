import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import {
  REPRODUCTION_SOFT_CAP,
  MAX_BLOB_COUNT,
  REPRODUCTION_THRESHOLD,
  REPRODUCTION_COOLDOWN,
  WORLD_W,
  WORLD_H,
} from '../engine/constants'
import { deriveDiet } from '../engine/diet'

function mutateTrait(val: number, mutationRate: number, prng: { nextGaussian: (m: number, s: number) => number }, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, prng.nextGaussian(val, mutationRate * 0.1)))
}

export const ReproductionSystem: System = {
  name: 'ReproductionSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    if (write.count >= REPRODUCTION_SOFT_CAP) return

    const { prng, freeList } = engine

    forEachAlive(read, (i) => {
      if (write.count >= REPRODUCTION_SOFT_CAP) return false  // short-circuit

      if (write.reproductionCooldown[i] > 0) {
        write.reproductionCooldown[i]--
        return
      }

      if (write.energy[i] < REPRODUCTION_THRESHOLD) return

      // Get child slot
      let child: number
      if (freeList.length > 0) {
        child = freeList.pop()!
      } else if (write.count < MAX_BLOB_COUNT) {
        child = write.count
      } else {
        return
      }

      // Split energy
      write.energy[i] *= 0.5
      const childEnergy = write.energy[i]

      // Copy parent traits with mutation
      const mr = read.mutationRate[i]
      write.x[child] = read.x[i] + prng.nextRange(-10, 10)
      write.y[child] = read.y[i] + prng.nextRange(-10, 10)
      write.x[child] = Math.max(0, Math.min(WORLD_W, write.x[child]))
      write.y[child] = Math.max(0, Math.min(WORLD_H, write.y[child]))
      write.vx[child] = prng.nextRange(-1, 1)
      write.vy[child] = prng.nextRange(-1, 1)
      write.energy[child] = childEnergy
      write.age[child] = 0
      write.hunger[child] = 1 - childEnergy / 100

      write.speed[child] = mutateTrait(read.speed[i], mr, prng, 0.1, 3)
      write.strength[child] = mutateTrait(read.strength[i], mr, prng)
      write.defense[child] = mutateTrait(read.defense[i], mr, prng)
      write.visionRadius[child] = mutateTrait(read.visionRadius[i], mr, prng, 20, 120)
      write.aggression[child] = mutateTrait(read.aggression[i], mr, prng)
      write.sociability[child] = mutateTrait(read.sociability[i], mr, prng)
      write.traitCuriosity[child] = mutateTrait(read.traitCuriosity[i], mr, prng)
      write.traitFear[child] = mutateTrait(read.traitFear[i], mr, prng)
      write.courage[child] = mutateTrait(read.courage[i], mr, prng)
      write.fertility[child] = mutateTrait(read.fertility[i], mr, prng)
      write.metabolism[child] = mutateTrait(read.metabolism[i], mr, prng, 0.05, 2)
      write.camouflage[child] = mutateTrait(read.camouflage[i], mr, prng)
      write.spikiness[child] = mutateTrait(read.spikiness[i], mr, prng)
      write.size[child] = mutateTrait(read.size[i], mr, prng, 0.2, 2)
      write.dietFloat[child] = mutateTrait(read.dietFloat[i], mr, prng)
      write.mutationRate[child] = mutateTrait(read.mutationRate[i], mr, prng, 0.01, 0.5)

      // Derive diet from dietFloat
      write.diet[child] = deriveDiet(write.dietFloat[child])

      write.emotionFear[child] = 0
      write.emotionConfidence[child] = 0.5
      write.emotionStress[child] = 0
      write.emotionCuriosity[child] = 0.5

      write.parentId[child] = i
      write.generation[child] = read.generation[i] + 1
      write.reproductionCooldown[child] = REPRODUCTION_COOLDOWN
      write.species[child] = read.species[i]  // inherit; SpeciationSystem may reassign
      write.alive[child] = 1
      write.count++

      // Set cooldown on parent
      write.reproductionCooldown[i] = REPRODUCTION_COOLDOWN

      // Store PRNG snapshot at reproduction events (for future Society Code / replay)
      engine.lastReproductionPrngState = prng.serializeState()
    })
  },
}
