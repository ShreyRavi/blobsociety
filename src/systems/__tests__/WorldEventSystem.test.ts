import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { WorldEventSystem } from '../WorldEventSystem'
import { PRNG } from '../../engine/prng'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(overrides: Partial<SimEngine> = {}): SimEngine {
  return {
    prng: new PRNG(42),
    tick: 0,
    worldEventFoodMod: 1.0,
    worldEventEndTick: 0,
    currentWorldEvent: null,
    ...overrides,
  } as unknown as SimEngine
}

describe('WorldEventSystem', () => {
  it('no event fires before EVENT_CHECK_INTERVAL ticks', () => {
    const engine = fakeEngine({ tick: 499 } as Partial<SimEngine>)
    const read = new StateBuffer(); const write = new StateBuffer()
    WorldEventSystem.update(read, write, engine)
    expect(engine.worldEventFoodMod).toBe(1.0)
    expect(engine.currentWorldEvent).toBeNull()
  })

  it('expires active event when tick >= endTick', () => {
    const engine = fakeEngine({ tick: 100, worldEventEndTick: 100, worldEventFoodMod: 0.2, currentWorldEvent: 'drought' } as Partial<SimEngine>)
    const read = new StateBuffer(); const write = new StateBuffer()
    WorldEventSystem.update(read, write, engine)
    expect(engine.worldEventFoodMod).toBe(1.0)
    expect(engine.worldEventEndTick).toBe(0)
  })

  it('foodMod stays 1.0 when no event active', () => {
    const engine = fakeEngine({ tick: 1 } as Partial<SimEngine>)
    const read = new StateBuffer(); const write = new StateBuffer()
    WorldEventSystem.update(read, write, engine)
    expect(engine.worldEventFoodMod).toBe(1.0)
  })

  it('event modifies foodMod away from 1.0 when triggered', () => {
    // Use a PRNG that always returns > EVENT_CHANCE
    const alwaysFirePrng = new PRNG(42)
    // Override nextFloat to always return 0 (< EVENT_CHANCE)
    const origNextFloat = alwaysFirePrng.nextFloat.bind(alwaysFirePrng)
    let callCount = 0
    alwaysFirePrng.nextFloat = () => {
      callCount++
      return callCount === 1 ? 0.0 : origNextFloat()  // first call (chance check) = 0 = fire
    }
    const engine = fakeEngine({ prng: alwaysFirePrng, tick: 500, worldEventEndTick: 0 } as Partial<SimEngine>)
    const read = new StateBuffer(); const write = new StateBuffer()
    WorldEventSystem.update(read, write, engine)
    // An event should have fired
    expect(engine.worldEventFoodMod).not.toBe(1.0)
    expect(engine.worldEventEndTick).toBeGreaterThan(0)
  })
})
