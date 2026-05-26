import { describe, it, expect, vi } from 'vitest'
import { StateBuffer } from '../../engine/StateBuffer'
import { PheromoneSystem } from '../PheromoneSystem'
import type { SimEngine } from '../../engine/SimEngine'

function fakeEngine(pheromone: SimEngine['pheromone']): SimEngine {
  return { pheromone } as unknown as SimEngine
}

describe('PheromoneSystem', () => {
  it('diffuse phase calls pheromone.diffuse()', () => {
    const pheromone = { diffuse: vi.fn(), swap: vi.fn(), deposit: vi.fn(), sample: vi.fn() }
    const read = new StateBuffer()
    const write = new StateBuffer()

    PheromoneSystem.update(read, write, fakeEngine(pheromone as unknown as SimEngine['pheromone']), 'diffuse')

    expect(pheromone.diffuse).toHaveBeenCalledOnce()
    expect(pheromone.swap).not.toHaveBeenCalled()
  })

  it('deposit phase calls pheromone.swap()', () => {
    const pheromone = { diffuse: vi.fn(), swap: vi.fn(), deposit: vi.fn(), sample: vi.fn() }
    const read = new StateBuffer()
    const write = new StateBuffer()

    PheromoneSystem.update(read, write, fakeEngine(pheromone as unknown as SimEngine['pheromone']), 'deposit')

    expect(pheromone.swap).toHaveBeenCalledOnce()
    expect(pheromone.diffuse).not.toHaveBeenCalled()
  })

  it('unknown phase calls neither diffuse nor swap', () => {
    const pheromone = { diffuse: vi.fn(), swap: vi.fn(), deposit: vi.fn(), sample: vi.fn() }
    const read = new StateBuffer()
    const write = new StateBuffer()

    PheromoneSystem.update(read, write, fakeEngine(pheromone as unknown as SimEngine['pheromone']), 'unknown')

    expect(pheromone.diffuse).not.toHaveBeenCalled()
    expect(pheromone.swap).not.toHaveBeenCalled()
  })

  it('no phase argument calls neither diffuse nor swap', () => {
    const pheromone = { diffuse: vi.fn(), swap: vi.fn(), deposit: vi.fn(), sample: vi.fn() }
    const read = new StateBuffer()
    const write = new StateBuffer()

    PheromoneSystem.update(read, write, fakeEngine(pheromone as unknown as SimEngine['pheromone']))

    expect(pheromone.diffuse).not.toHaveBeenCalled()
    expect(pheromone.swap).not.toHaveBeenCalled()
  })
})
