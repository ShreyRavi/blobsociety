import { PRNG } from './prng'
import { StateBuffer, forEachAlive } from './StateBuffer'
import { SpatialHash } from './SpatialHash'
import { PheromoneGrid } from './PheromoneGrid'
import { FoodPool } from './FoodPool'
import { MemoryStore } from './MemoryStore'
import { InteractionLog } from './InteractionLog'
import { generateBiomeMap } from './biome'
import { deriveDiet } from './diet'
import type { SystemRegistration } from './System'
import {
  INITIAL_BLOB_COUNT,
  INITIAL_FOOD_COUNT,
  WORLD_W,
  WORLD_H,
  BASE_FOOD_RATE,
  MEMORY_SNAPSHOT_HZ,
  RAF_DT_MAX,
} from './constants'

import { PheromoneSystem } from '../systems/PheromoneSystem'
import { PerceptionSystem } from '../systems/PerceptionSystem'
import { EmotionSystem } from '../systems/EmotionSystem'
import { MemorySystem } from '../systems/MemorySystem'
import { InteractionSystem } from '../systems/InteractionSystem'
import { CombatSystem } from '../systems/CombatSystem'
import { FoodSystem } from '../systems/FoodSystem'
import { BiomeSystem } from '../systems/BiomeSystem'
import { EnergySystem } from '../systems/EnergySystem'
import { MovementSystem } from '../systems/MovementSystem'
import { ReproductionSystem } from '../systems/ReproductionSystem'
import { AgingSystem } from '../systems/AgingSystem'
import { SpeciationSystem } from '../systems/SpeciationSystem'
import { WorldEventSystem } from '../systems/WorldEventSystem'

export interface SimSnapshot {
  tick: number
  blobCount: number
  readBuf: StateBuffer
  pheromoneBuffer: Float32Array
  foodPool: FoodPool
  speciesCounts: Map<number, number>
  worldEventFoodMod: number
  currentWorldEvent: string | null
  paused: boolean
  crashError: string | null
  speedMultiplier: number
}

export interface SimEngine {
  prng: PRNG
  readBuf: StateBuffer
  writeBuf: StateBuffer
  spatialHash: typeof SpatialHash
  pheromone: PheromoneGrid
  foodPool: FoodPool
  memoryStore: MemoryStore
  newInteractionLog: InteractionLog
  prevInteractionLog: InteractionLog
  freeList: number[]
  tick: number
  baseFoodSpawnRate: number
  worldEventFoodMod: number
  worldEventEndTick: number
  currentWorldEvent: string | null
  nextSpeciesId: number
  speciesCentroids: Map<number, { centroid: number[]; n: number }>
  lastReproductionPrngState: Uint32Array | null
  speedMultiplier: number
  paused: boolean
  crashError: string | null
  start(): void
  stop(): void
  setPaused(p: boolean): void
  setSpeed(s: number): void
  subscribe(cb: (snapshot: SimSnapshot) => void): () => void
}


function spawnInitialBlobs(engine: SimEngine): void {
  const { writeBuf: buf, prng } = engine
  for (let i = 0; i < INITIAL_BLOB_COUNT; i++) {
    buf.x[i] = prng.nextRange(20, WORLD_W - 20)
    buf.y[i] = prng.nextRange(20, WORLD_H - 20)
    buf.vx[i] = prng.nextRange(-1, 1)
    buf.vy[i] = prng.nextRange(-1, 1)
    buf.energy[i] = prng.nextRange(55, 80)
    buf.age[i] = 0
    buf.hunger[i] = 1 - buf.energy[i] / 100
    buf.speed[i] = prng.nextRange(0.5, 1.5)
    buf.strength[i] = prng.nextRange(0.3, 0.7)
    buf.defense[i] = prng.nextRange(0.3, 0.7)
    buf.visionRadius[i] = prng.nextRange(40, 90)
    buf.aggression[i] = prng.nextRange(0.1, 0.7)
    buf.sociability[i] = prng.nextRange(0.2, 0.8)
    buf.traitCuriosity[i] = prng.nextRange(0.2, 0.8)
    buf.traitFear[i] = prng.nextRange(0.1, 0.6)
    buf.courage[i] = prng.nextRange(0.2, 0.8)
    buf.fertility[i] = prng.nextRange(0.3, 0.7)
    buf.metabolism[i] = prng.nextRange(0.08, 0.4)
    buf.camouflage[i] = prng.nextRange(0, 0.6)
    buf.spikiness[i] = prng.nextRange(0, 0.5)
    buf.size[i] = prng.nextRange(0.4, 1.2)
    buf.dietFloat[i] = prng.nextFloat()
    buf.diet[i] = deriveDiet(buf.dietFloat[i])
    buf.mutationRate[i] = prng.nextRange(0.05, 0.3)
    buf.emotionFear[i] = 0.2
    buf.emotionConfidence[i] = 0.5
    buf.emotionStress[i] = 0.1
    buf.emotionCuriosity[i] = 0.5
    buf.parentId[i] = 0xffffffff
    buf.generation[i] = 0
    buf.reproductionCooldown[i] = Math.floor(prng.nextRange(0, 200))
    buf.species[i] = 1
    buf.alive[i] = 1
    buf.count++
  }
}

function buildSystems(): SystemRegistration[] {
  return [
    { system: PheromoneSystem, phase: 'diffuse' },
    { system: PerceptionSystem },
    { system: EmotionSystem },
    { system: MemorySystem },
    { system: InteractionSystem },
    { system: CombatSystem },
    { system: FoodSystem },
    { system: BiomeSystem },
    { system: EnergySystem },
    { system: MovementSystem },
    { system: ReproductionSystem },
    { system: AgingSystem },
    { system: SpeciationSystem },
    { system: WorldEventSystem },
    { system: PheromoneSystem, phase: 'deposit' },
  ]
}

function rebuildSpatialHash(engine: SimEngine): void {
  const { readBuf } = engine
  SpatialHash.clear()
  forEachAlive(readBuf, (i) => {
    SpatialHash.insert(i, readBuf.x[i], readBuf.y[i])
  })
}

function computeSpeciesCounts(readBuf: StateBuffer): Map<number, number> {
  const counts = new Map<number, number>()
  forEachAlive(readBuf, (i) => {
    const s = readBuf.species[i]
    counts.set(s, (counts.get(s) ?? 0) + 1)
  })
  return counts
}

function createEngine(seed: number): SimEngine {
  const prng = new PRNG(seed)

  generateBiomeMap(seed)

  const readBuf = new StateBuffer()
  const writeBuf = new StateBuffer()

  const engine: SimEngine = {
    prng,
    readBuf,
    writeBuf,
    spatialHash: SpatialHash,
    pheromone: new PheromoneGrid(),
    foodPool: new FoodPool(),
    memoryStore: new MemoryStore(),
    newInteractionLog: new InteractionLog(),
    prevInteractionLog: new InteractionLog(),
    freeList: [],
    tick: 0,
    baseFoodSpawnRate: BASE_FOOD_RATE,
    worldEventFoodMod: 1.0,
    worldEventEndTick: 0,
    currentWorldEvent: null,
    nextSpeciesId: 2,
    speciesCentroids: new Map(),
    lastReproductionPrngState: null,
    speedMultiplier: 1,
    paused: false,
    crashError: null,
    start,
    stop,
    setPaused,
    setSpeed,
    subscribe,
  }

  spawnInitialBlobs(engine)

  // Pre-populate food pool so blobs don't immediately starve
  for (let f = 0; f < INITIAL_FOOD_COUNT; f++) {
    engine.foodPool.spawn(
      engine.prng.nextRange(0, WORLD_W),
      engine.prng.nextRange(0, WORLD_H),
      engine.prng.nextRange(5, 30),
    )
  }

  // Copy initial writeBuf → readBuf so tick() starts with valid data
  engine.readBuf.copyFrom(engine.writeBuf)

  return engine
}

// --- Module-scope singleton ---
const SEED_KEY = 'blobsociety_seed'

function loadSeed(): number {
  try {
    const stored = localStorage.getItem(SEED_KEY)
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n)) return n
    }
  } catch {}
  const s = Date.now() ^ (Math.random() * 0x7fffffff)
  try { localStorage.setItem(SEED_KEY, String(s)) } catch {}
  return s
}

const systems = buildSystems()
const engine = createEngine(loadSeed())

// Save seed on tab hide/unload
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      try {
        localStorage.setItem(SEED_KEY, String(engine.prng.serializeState()[0]))
      } catch {}
    }
  })
}

let rafId: number | null = null
let lastTs = 0
let frameCount = 0
const subscribers = new Set<(s: SimSnapshot) => void>()

function runTick(): void {
  // 1. Copy read → write (double-buffer setup)
  engine.writeBuf.copyFrom(engine.readBuf)

  // 2. Rebuild spatial hash from readBuf
  rebuildSpatialHash(engine)

  // 3. Run all systems in order
  for (const reg of systems) {
    if (!reg.system.enabled) continue
    reg.system.update(engine.readBuf, engine.writeBuf, engine, reg.phase)
  }

  // 4. Rotate interaction logs
  const tmp = engine.prevInteractionLog
  engine.prevInteractionLog = engine.newInteractionLog
  engine.newInteractionLog = tmp
  engine.newInteractionLog.clear()

  // 5. Swap buffers (writeBuf becomes next readBuf)
  const swapBuf = engine.readBuf
  engine.readBuf = engine.writeBuf
  engine.writeBuf = swapBuf

  engine.tick++
}

function pushSnapshot(): void {
  const snapshot: SimSnapshot = {
    tick: engine.tick,
    blobCount: engine.readBuf.count,
    readBuf: engine.readBuf,
    pheromoneBuffer: engine.pheromone.getReadBuffer(),
    foodPool: engine.foodPool,
    speciesCounts: computeSpeciesCounts(engine.readBuf),
    worldEventFoodMod: engine.worldEventFoodMod,
    currentWorldEvent: engine.currentWorldEvent,
    paused: engine.paused,
    crashError: engine.crashError,
    speedMultiplier: engine.speedMultiplier,
  }
  subscribers.forEach(cb => cb(snapshot))
}

function rafLoop(ts: number): void {
  if (lastTs === 0) lastTs = ts
  const elapsed = ts - lastTs
  if (elapsed > RAF_DT_MAX) lastTs = ts - RAF_DT_MAX  // cap large gaps
  lastTs = ts

  if (!engine.paused && engine.crashError === null) {
    try {
      const n = engine.speedMultiplier
      for (let s = 0; s < n; s++) runTick()
    } catch (err) {
      engine.crashError = err instanceof Error ? err.message : String(err)
      engine.paused = true
      pushSnapshot()
    }
  }

  frameCount++
  if (frameCount % MEMORY_SNAPSHOT_HZ === 0) {
    pushSnapshot()
  }

  rafId = requestAnimationFrame(rafLoop)
}

function start(): void {
  if (rafId !== null) return  // already running
  lastTs = 0
  frameCount = 0
  rafId = requestAnimationFrame(rafLoop)
}

function stop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function setPaused(p: boolean): void {
  engine.paused = p
  pushSnapshot()
}

function setSpeed(s: number): void {
  engine.speedMultiplier = Math.max(1, Math.min(10, Math.round(s)))
}

function subscribe(cb: (snapshot: SimSnapshot) => void): () => void {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

export function getEngine(): SimEngine {
  return engine
}
