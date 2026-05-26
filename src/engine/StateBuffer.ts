import { MAX_BLOB_COUNT } from './constants'

export class StateBuffer {
  // Position & motion
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array

  // Biological
  energy: Float32Array
  age: Uint32Array
  hunger: Float32Array

  // Evolvable traits (heritable, mutate on reproduction)
  speed: Float32Array
  strength: Float32Array
  defense: Float32Array
  visionRadius: Float32Array
  aggression: Float32Array
  sociability: Float32Array
  traitCuriosity: Float32Array
  traitFear: Float32Array
  courage: Float32Array
  fertility: Float32Array
  metabolism: Float32Array
  camouflage: Float32Array
  spikiness: Float32Array
  size: Float32Array
  dietFloat: Float32Array
  mutationRate: Float32Array

  // Runtime emotion (not heritable; updated by EmotionSystem)
  emotionFear: Float32Array
  emotionConfidence: Float32Array
  emotionStress: Float32Array
  emotionCuriosity: Float32Array

  // Reproduction
  parentId: Uint32Array
  generation: Uint32Array
  reproductionCooldown: Float32Array

  // Classification
  diet: Uint8Array
  species: Uint32Array
  alive: Uint8Array

  count: number

  constructor() {
    const n = MAX_BLOB_COUNT
    this.x = new Float32Array(n)
    this.y = new Float32Array(n)
    this.vx = new Float32Array(n)
    this.vy = new Float32Array(n)
    this.energy = new Float32Array(n)
    this.age = new Uint32Array(n)
    this.hunger = new Float32Array(n)
    this.speed = new Float32Array(n)
    this.strength = new Float32Array(n)
    this.defense = new Float32Array(n)
    this.visionRadius = new Float32Array(n)
    this.aggression = new Float32Array(n)
    this.sociability = new Float32Array(n)
    this.traitCuriosity = new Float32Array(n)
    this.traitFear = new Float32Array(n)
    this.courage = new Float32Array(n)
    this.fertility = new Float32Array(n)
    this.metabolism = new Float32Array(n)
    this.camouflage = new Float32Array(n)
    this.spikiness = new Float32Array(n)
    this.size = new Float32Array(n)
    this.dietFloat = new Float32Array(n)
    this.mutationRate = new Float32Array(n)
    this.emotionFear = new Float32Array(n)
    this.emotionConfidence = new Float32Array(n)
    this.emotionStress = new Float32Array(n)
    this.emotionCuriosity = new Float32Array(n)
    this.parentId = new Uint32Array(n)
    this.generation = new Uint32Array(n)
    this.reproductionCooldown = new Float32Array(n)
    this.diet = new Uint8Array(n)
    this.species = new Uint32Array(n)
    this.alive = new Uint8Array(n)
    this.count = 0
  }

  copyFrom(src: StateBuffer): void {
    this.x.set(src.x)
    this.y.set(src.y)
    this.vx.set(src.vx)
    this.vy.set(src.vy)
    this.energy.set(src.energy)
    this.age.set(src.age)
    this.hunger.set(src.hunger)
    this.speed.set(src.speed)
    this.strength.set(src.strength)
    this.defense.set(src.defense)
    this.visionRadius.set(src.visionRadius)
    this.aggression.set(src.aggression)
    this.sociability.set(src.sociability)
    this.traitCuriosity.set(src.traitCuriosity)
    this.traitFear.set(src.traitFear)
    this.courage.set(src.courage)
    this.fertility.set(src.fertility)
    this.metabolism.set(src.metabolism)
    this.camouflage.set(src.camouflage)
    this.spikiness.set(src.spikiness)
    this.size.set(src.size)
    this.dietFloat.set(src.dietFloat)
    this.mutationRate.set(src.mutationRate)
    this.emotionFear.set(src.emotionFear)
    this.emotionConfidence.set(src.emotionConfidence)
    this.emotionStress.set(src.emotionStress)
    this.emotionCuriosity.set(src.emotionCuriosity)
    this.parentId.set(src.parentId)
    this.generation.set(src.generation)
    this.reproductionCooldown.set(src.reproductionCooldown)
    this.diet.set(src.diet)
    this.species.set(src.species)
    this.alive.set(src.alive)
    this.count = src.count
  }
}

export function forEachAlive(
  buf: StateBuffer,
  cb: (i: number) => void | false,
): void {
  for (let i = 0; i < MAX_BLOB_COUNT; i++) {
    if (!buf.alive[i]) continue
    if (cb(i) === false) break
  }
}
