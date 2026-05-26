import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'

export const CombatSystem: System = {
  name: 'CombatSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    const { newInteractionLog, memoryStore, prng } = engine

    for (const entry of newInteractionLog.entries) {
      if (entry.action !== 'fight' && entry.action !== 'hunt') continue
      const { actorId: a, targetId: t } = entry
      if (t < 0 || !read.alive[a] || !read.alive[t]) continue

      // Combat resolution
      const atkPow = read.strength[a] + prng.nextFloat() * 0.25
      const defPow = read.defense[t] + read.spikiness[t] * 0.3 + prng.nextFloat() * 0.15

      if (atkPow > defPow) {
        const stolen = Math.min(18, write.energy[t] * 0.28)
        write.energy[t] -= stolen
        write.energy[a] = Math.min(100, write.energy[a] + stolen * 0.55)
        memoryStore.update(t, a, -0.2, true, false)
      } else {
        // Defender repels — spikiness reflects damage
        const reflected = read.spikiness[t] * 6 + 2
        write.energy[a] = Math.max(0, write.energy[a] - reflected)
        memoryStore.update(a, t, -0.1, false, false)
      }
    }
  },
}
