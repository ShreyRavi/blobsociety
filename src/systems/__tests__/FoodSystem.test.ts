import { describe, it, expect } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { FoodSystem } from '../FoodSystem'
import { FoodPool } from '../../engine/FoodPool'
import { PheromoneGrid } from '../../engine/PheromoneGrid'
import { PRNG } from '../../engine/prng'
import type { SimEngine } from '../../engine/SimEngine'
import { DIET_HERBIVORE, DIET_CARNIVORE } from '../../engine/constants'

function fakeEngine(overrides: Partial<SimEngine> = {}): SimEngine {
  return {
    foodPool: new FoodPool(),
    pheromone: new PheromoneGrid(),
    prng: new PRNG(42),
    baseFoodSpawnRate: 1,
    worldEventFoodMod: 1,
    ...overrides,
  } as unknown as SimEngine
}

function makeBuffers(setup: (b: StateBuffer) => void) {
  const read = new StateBuffer()
  const write = new StateBuffer()
  setup(read)
  write.copyFrom(read)
  return { read, write }
}

describe('FoodSystem', () => {
  it('herbivore consumes nearby food', () => {
    const engine = fakeEngine({ baseFoodSpawnRate: 0, worldEventFoodMod: 1 } as Partial<SimEngine>)
    engine.foodPool.spawn(105, 105, 20)

    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 100; b.y[0] = 100
      b.diet[0] = DIET_HERBIVORE
      b.energy[0] = 50
      b.visionRadius[0] = 80
    })

    FoodSystem.update(read, write, engine)
    expect(write.energy[0]).toBeGreaterThan(50)
    expect(engine.foodPool.alive[0]).toBe(0)
  })

  it('carnivore does not consume plant food', () => {
    const engine = fakeEngine({ baseFoodSpawnRate: 0, worldEventFoodMod: 1 } as Partial<SimEngine>)
    engine.foodPool.spawn(102, 102, 15)

    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 100; b.y[0] = 100
      b.diet[0] = DIET_CARNIVORE
      b.energy[0] = 50
      b.visionRadius[0] = 80
    })

    FoodSystem.update(read, write, engine)
    expect(write.energy[0]).toBe(50)
    expect(engine.foodPool.alive[0]).toBe(1)
  })

  it('does not consume food outside vision radius', () => {
    const engine = fakeEngine({ baseFoodSpawnRate: 0, worldEventFoodMod: 1 } as Partial<SimEngine>)
    engine.foodPool.spawn(500, 500, 15)

    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 100; b.y[0] = 100
      b.diet[0] = DIET_HERBIVORE
      b.energy[0] = 50
      b.visionRadius[0] = 30
    })

    FoodSystem.update(read, write, engine)
    expect(write.energy[0]).toBe(50)
    expect(engine.foodPool.alive[0]).toBe(1)
  })

  it('clamps energy to 100 after eating', () => {
    const engine = fakeEngine({ baseFoodSpawnRate: 0, worldEventFoodMod: 1 } as Partial<SimEngine>)
    engine.foodPool.spawn(102, 102, 30)

    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 100; b.y[0] = 100
      b.diet[0] = DIET_HERBIVORE
      b.energy[0] = 95
      b.visionRadius[0] = 80
    })

    FoodSystem.update(read, write, engine)
    expect(write.energy[0]).toBe(100)
  })

  it('spawns new food each tick', () => {
    const engine = fakeEngine({ baseFoodSpawnRate: 5, worldEventFoodMod: 1 } as Partial<SimEngine>)
    const { read, write } = makeBuffers(_b => {})
    const before = engine.foodPool.count
    FoodSystem.update(read, write, engine)
    expect(engine.foodPool.count).toBeGreaterThan(before)
  })

  it('deposits food pheromone when consuming', () => {
    const engine = fakeEngine({ baseFoodSpawnRate: 0, worldEventFoodMod: 1 } as Partial<SimEngine>)
    engine.foodPool.spawn(105, 105, 15)
    const { read, write } = makeBuffers(b => {
      b.alive[0] = 1; b.count = 1
      b.x[0] = 100; b.y[0] = 100
      b.diet[0] = DIET_HERBIVORE
      b.energy[0] = 50; b.visionRadius[0] = 80
    })
    FoodSystem.update(read, write, engine)
    engine.pheromone.swap()
    expect(engine.pheromone.sample(100, 100, 0)).toBeGreaterThan(0)
  })
})
