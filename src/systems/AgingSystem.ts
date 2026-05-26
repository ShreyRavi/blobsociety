import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { BASE_LIFESPAN } from '../engine/constants'

export const AgingSystem: System = {
  name: 'AgingSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    forEachAlive(read, (i) => {
      write.age[i]++
      const lifespan = BASE_LIFESPAN + read.size[i] * 500  // larger blobs live longer

      if (write.energy[i] <= 0 || write.age[i] > lifespan) {
        write.alive[i] = 0
        write.count--
        engine.freeList.push(i)
        engine.memoryStore.clearRefsTo(i)
        engine.memoryStore.clearBlob(i)
      }
    })
  },
}
