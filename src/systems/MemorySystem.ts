import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'

export const MemorySystem: System = {
  name: 'MemorySystem',
  enabled: true,

  update(read: StateBuffer, _write: StateBuffer, engine: SimEngine): void {
    const { memoryStore, prevInteractionLog } = engine

    for (const entry of prevInteractionLog.entries) {
      const { actorId, targetId, action } = entry
      if (!read.alive[actorId] || !read.alive[targetId]) continue

      switch (action) {
        case 'fight':
          memoryStore.update(actorId, targetId, -0.15, true, false)
          memoryStore.update(targetId, actorId, -0.2, true, false)
          break
        case 'hunt':
          memoryStore.update(targetId, actorId, -0.25, true, false)
          break
        case 'share':
          memoryStore.update(actorId, targetId, 0.1, false, true)
          memoryStore.update(targetId, actorId, 0.15, false, true)
          break
        case 'follow':
          memoryStore.update(actorId, targetId, 0.05, false, false)
          break
      }
    }

    memoryStore.ageAll()
  },
}
