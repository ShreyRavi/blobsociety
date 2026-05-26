import { MAX_FOOD_COUNT } from './constants'

export class FoodPool {
  x: Float32Array
  y: Float32Array
  value: Float32Array
  alive: Uint8Array
  count: number
  private freeList: Uint16Array
  private freeTop: number

  constructor() {
    this.x = new Float32Array(MAX_FOOD_COUNT)
    this.y = new Float32Array(MAX_FOOD_COUNT)
    this.value = new Float32Array(MAX_FOOD_COUNT)
    this.alive = new Uint8Array(MAX_FOOD_COUNT)
    this.count = 0
    this.freeList = new Uint16Array(MAX_FOOD_COUNT)
    this.freeTop = 0
    // Pre-fill free list in reverse so slot 0 is first out
    for (let i = MAX_FOOD_COUNT - 1; i >= 0; i--) {
      this.freeList[this.freeTop++] = i
    }
  }

  spawn(x: number, y: number, value: number): boolean {
    if (this.freeTop === 0) return false
    const slot = this.freeList[--this.freeTop]
    this.x[slot] = x
    this.y[slot] = y
    this.value[slot] = value
    this.alive[slot] = 1
    this.count++
    return true
  }

  consume(slot: number): number {
    if (!this.alive[slot]) return 0
    this.alive[slot] = 0
    this.count--
    this.freeList[this.freeTop++] = slot
    return this.value[slot]
  }
}
