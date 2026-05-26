import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'
import { forEachAlive } from '../engine/StateBuffer'
import { neighborLists, neighborCounts } from './PerceptionSystem'
import { PHERO_DANGER, PHERO_FOOD, PHERO_TERRITORY, PHERO_MATING } from '../engine/PheromoneGrid'
import {
  DIET_CARNIVORE,
  DIET_SCAVENGER,
  DIET_HERBIVORE,
  DIET_OMNIVORE,
} from '../engine/constants'

let _nx = 0
let _ny = 0

function setNorm(dx: number, dy: number): void {
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d > 0) { _nx = dx / d; _ny = dy / d } else { _nx = 0; _ny = 0 }
}

function setPheroGradient(
  pheromone: SimEngine['pheromone'],
  x: number,
  y: number,
  ch: number,
): void {
  const step = 8
  const gx = pheromone.sample(x + step, y, ch) - pheromone.sample(x - step, y, ch)
  const gy = pheromone.sample(x, y + step, ch) - pheromone.sample(x, y - step, ch)
  setNorm(gx, gy)
}

export const InteractionSystem: System = {
  name: 'InteractionSystem',
  enabled: true,

  update(read: StateBuffer, write: StateBuffer, engine: SimEngine): void {
    const { pheromone, memoryStore, newInteractionLog, prng, tick } = engine

    forEachAlive(read, (i) => {
      const nc = neighborCounts[i]
      const x = read.x[i]
      const y = read.y[i]
      const diet = read.diet[i]
      const hunger = read.hunger[i]
      const fear = write.emotionFear[i]
      const confidence = write.emotionConfidence[i]
      const aggression = read.aggression[i]
      const sociability = read.sociability[i]
      const courage = read.courage[i]

      let vx = write.vx[i]
      let vy = write.vy[i]
      let actionLogged = false

      // --- 1. FLEE: high fear or heavy danger pheromone ---
      const dangerPhero = pheromone.sample(x, y, PHERO_DANGER)
      if (fear > 0.65 || dangerPhero > 0.6) {
        // Find closest threat
        let threatX = 0
        let threatY = 0
        let found = false
        let minD2 = Infinity
        for (let k = 0; k < nc; k++) {
          const j = neighborLists[i][k]
          const d = read.diet[j]
          if ((d === DIET_CARNIVORE || d === DIET_SCAVENGER) && read.strength[j] > read.strength[i] * 0.8) {
            const dx = read.x[j] - x
            const dy = read.y[j] - y
            const d2 = dx * dx + dy * dy
            if (d2 < minD2) { minD2 = d2; threatX = dx; threatY = dy; found = true }
          }
        }

        if (found) {
          setNorm(-threatX, -threatY)
          vx = _nx; vy = _ny
          newInteractionLog.log({ actorId: i, targetId: -1, action: 'flee', tick, energyDelta: 0 })
          pheromone.deposit(x, y, PHERO_DANGER, 0.4)
          actionLogged = true
        }
      }

      // --- 2. HUNT: carnivore/scavenger when hungry ---
      if (!actionLogged && (diet === DIET_CARNIVORE || diet === DIET_SCAVENGER) && hunger > 0.45) {
        let preyIdx = -1
        let minD2 = Infinity
        for (let k = 0; k < nc; k++) {
          const j = neighborLists[i][k]
          const jd = read.diet[j]
          if (jd === DIET_HERBIVORE || jd === DIET_OMNIVORE) {
            const dx = read.x[j] - x
            const dy = read.y[j] - y
            const d2 = dx * dx + dy * dy
            if (d2 < minD2) { minD2 = d2; preyIdx = j }
          }
        }
        if (preyIdx !== -1) {
          setNorm(read.x[preyIdx] - x, read.y[preyIdx] - y)
          vx = _nx; vy = _ny
          newInteractionLog.log({ actorId: i, targetId: preyIdx, action: 'hunt', tick, energyDelta: 0 })
          pheromone.deposit(x, y, PHERO_DANGER, 0.3)
          actionLogged = true
        }
      }

      // --- 3. FIGHT: aggressive + confident ---
      if (!actionLogged && aggression > 0.65 && courage > fear + 0.1 && nc > 0) {
        let rivalIdx = -1
        let minD2 = Infinity
        for (let k = 0; k < nc; k++) {
          const j = neighborLists[i][k]
          // Fight rivals of other species, or anyone with negative trust
          const trust = memoryStore.getTrust(i, j)
          if (read.species[j] !== read.species[i] || trust < -0.3) {
            const dx = read.x[j] - x
            const dy = read.y[j] - y
            const d2 = dx * dx + dy * dy
            if (d2 < minD2 && read.strength[i] * (confidence + 0.1) > read.defense[j] * 0.7) {
              minD2 = d2; rivalIdx = j
            }
          }
        }
        if (rivalIdx !== -1) {
          setNorm(read.x[rivalIdx] - x, read.y[rivalIdx] - y)
          vx = _nx; vy = _ny
          newInteractionLog.log({ actorId: i, targetId: rivalIdx, action: 'fight', tick, energyDelta: 0 })
          pheromone.deposit(x, y, PHERO_TERRITORY, 0.5)
          actionLogged = true
        }
      }

      // --- 4. SHARE: social + energy to spare ---
      if (!actionLogged && sociability > 0.65 && read.energy[i] > 65) {
        let partnerIdx = -1
        let bestTrust = 0.15  // must have some trust to share
        for (let k = 0; k < nc; k++) {
          const j = neighborLists[i][k]
          if (read.species[j] === read.species[i] && read.hunger[j] > 0.5) {
            const trust = memoryStore.getTrust(i, j)
            if (trust > bestTrust) { bestTrust = trust; partnerIdx = j }
          }
        }
        if (partnerIdx !== -1) {
          const gift = Math.min(8, (read.energy[i] - 50) * 0.3)
          write.energy[i] -= gift
          write.energy[partnerIdx] = Math.min(100, write.energy[partnerIdx] + gift)
          newInteractionLog.log({ actorId: i, targetId: partnerIdx, action: 'share', tick, energyDelta: gift })
          pheromone.deposit(x, y, PHERO_MATING, 0.2)
          // Wander near partner
          setNorm(read.x[partnerIdx] - x, read.y[partnerIdx] - y)
          vx = _nx * 0.3; vy = _ny * 0.3
          actionLogged = true
        }
      }

      // --- 5. FOLLOW: sociable, trusted neighbor ---
      if (!actionLogged && sociability > 0.4 && nc > 0) {
        let leadIdx = -1
        let bestTrust = 0.05
        for (let k = 0; k < nc; k++) {
          const j = neighborLists[i][k]
          const trust = memoryStore.getTrust(i, j)
          if (trust > bestTrust) { bestTrust = trust; leadIdx = j }
        }
        if (leadIdx !== -1) {
          setNorm(read.x[leadIdx] - x, read.y[leadIdx] - y)
          vx = _nx; vy = _ny
          newInteractionLog.log({ actorId: i, targetId: leadIdx, action: 'follow', tick, energyDelta: 0 })
          pheromone.deposit(x, y, PHERO_TERRITORY, 0.1)
          actionLogged = true
        }
      }

      // --- 6. FORAGE: follow food pheromone gradient ---
      if (!actionLogged && (diet === DIET_HERBIVORE || diet === DIET_OMNIVORE) && hunger > 0.25) {
        setPheroGradient(pheromone, x, y, PHERO_FOOD)
        if (_nx !== 0 || _ny !== 0) {
          vx = _nx; vy = _ny
          newInteractionLog.log({ actorId: i, targetId: -1, action: 'forage', tick, energyDelta: 0 })
          actionLogged = true
        }
      }

      // --- 7. EXPLORE: curiosity-driven wander with bias ---
      if (!actionLogged) {
        const curiosity = write.emotionCuriosity[i]
        // Blend current velocity with random impulse
        const angle = prng.nextFloat() * Math.PI * 2
        const impulse = curiosity * 0.4 + 0.1
        vx = vx * 0.7 + Math.cos(angle) * impulse
        vy = vy * 0.7 + Math.sin(angle) * impulse
        setNorm(vx, vy)
        vx = _nx; vy = _ny
        newInteractionLog.log({ actorId: i, targetId: -1, action: 'wander', tick, energyDelta: 0 })
      }

      // Deposit territory pheromone continuously (low level)
      pheromone.deposit(x, y, PHERO_TERRITORY, 0.05)

      write.vx[i] = vx
      write.vy[i] = vy
    })
  },
}
