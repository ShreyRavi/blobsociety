import type { System } from '../engine/System'
import type { StateBuffer } from '../engine/StateBuffer'
import type { SimEngine } from '../engine/SimEngine'

const EVENT_CHECK_INTERVAL = 500
const EVENT_CHANCE = 0.3

type WorldEvent = {
  name: string
  foodMod: number
  duration: number
}

const EVENTS: WorldEvent[] = [
  { name: 'drought',  foodMod: 0.15, duration: 250 },
  { name: 'rain',     foodMod: 2.2,  duration: 150 },
  { name: 'bloom',    foodMod: 3.0,  duration: 80  },
  { name: 'blight',   foodMod: 0.05, duration: 180 },
]

export const WorldEventSystem: System = {
  name: 'WorldEventSystem',
  enabled: true,

  update(_read: StateBuffer, _write: StateBuffer, engine: SimEngine): void {
    const { tick } = engine

    // Expire active event
    if (engine.worldEventEndTick > 0 && tick >= engine.worldEventEndTick) {
      engine.worldEventFoodMod = 1.0
      engine.worldEventEndTick = 0
    }

    // Check for new event every interval (only if no event active)
    if (tick > 0 && tick % EVENT_CHECK_INTERVAL === 0 && engine.worldEventEndTick === 0) {
      if (engine.prng.nextFloat() < EVENT_CHANCE) {
        const ev = EVENTS[Math.floor(engine.prng.nextFloat() * EVENTS.length)]
        engine.worldEventFoodMod = ev.foodMod
        engine.worldEventEndTick = tick + ev.duration
        engine.currentWorldEvent = ev.name
      }
    }

    // Clear event name once expired
    if (engine.worldEventEndTick === 0) {
      engine.currentWorldEvent = null
    }
  },
}
