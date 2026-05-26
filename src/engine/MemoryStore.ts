import { MAX_BLOB_COUNT, MAX_MEMORY_SLOTS } from './constants'

const TOTAL = MAX_BLOB_COUNT * MAX_MEMORY_SLOTS

export class MemoryStore {
  knownIds: Uint32Array          // 0 = empty slot
  trustScores: Float32Array      // [-1, 1]
  interactionAge: Uint32Array    // ticks since last interaction (LRU key — higher = older)
  betrayalCount: Uint8Array
  cooperationCount: Uint8Array

  constructor() {
    this.knownIds = new Uint32Array(TOTAL)
    this.trustScores = new Float32Array(TOTAL)
    this.interactionAge = new Uint32Array(TOTAL).fill(0xffffffff)
    this.betrayalCount = new Uint8Array(TOTAL)
    this.cooperationCount = new Uint8Array(TOTAL)
  }

  private baseIdx(blobId: number): number {
    return blobId * MAX_MEMORY_SLOTS
  }

  private findSlot(blobId: number, targetId: number): number {
    const base = this.baseIdx(blobId)
    for (let s = 0; s < MAX_MEMORY_SLOTS; s++) {
      if (this.knownIds[base + s] === targetId && this.interactionAge[base + s] !== 0xffffffff) {
        return s
      }
    }
    return -1
  }

  private lruSlot(blobId: number): number {
    const base = this.baseIdx(blobId)
    let maxAge = -1
    let slot = 0
    for (let s = 0; s < MAX_MEMORY_SLOTS; s++) {
      if (this.interactionAge[base + s] > maxAge) {
        maxAge = this.interactionAge[base + s]
        slot = s
      }
    }
    return slot
  }

  getTrust(blobId: number, targetId: number): number {
    const s = this.findSlot(blobId, targetId)
    if (s === -1) return 0
    return this.trustScores[this.baseIdx(blobId) + s]
  }

  update(blobId: number, targetId: number, trustDelta: number, betrayal: boolean, cooperation: boolean): void {
    const base = this.baseIdx(blobId)
    let s = this.findSlot(blobId, targetId)

    if (s === -1) {
      // Find empty slot (interactionAge === 0xffffffff means empty)
      s = -1
      for (let k = 0; k < MAX_MEMORY_SLOTS; k++) {
        if (this.interactionAge[base + k] === 0xffffffff) { s = k; break }
      }
      // Evict LRU if full
      if (s === -1) s = this.lruSlot(blobId)
      this.knownIds[base + s] = targetId
      this.trustScores[base + s] = 0
      this.betrayalCount[base + s] = 0
      this.cooperationCount[base + s] = 0
    }

    this.trustScores[base + s] = Math.max(-1, Math.min(1, this.trustScores[base + s] + trustDelta))
    this.interactionAge[base + s] = 0  // reset age on interaction
    if (betrayal && this.betrayalCount[base + s] < 255) this.betrayalCount[base + s]++
    if (cooperation && this.cooperationCount[base + s] < 255) this.cooperationCount[base + s]++
  }

  ageAll(): void {
    for (let i = 0; i < TOTAL; i++) {
      if (this.interactionAge[i] !== 0xffffffff) {
        this.interactionAge[i]++
      }
    }
  }

  clearBlob(blobId: number): void {
    const base = this.baseIdx(blobId)
    for (let s = 0; s < MAX_MEMORY_SLOTS; s++) {
      this.knownIds[base + s] = 0
      this.trustScores[base + s] = 0
      this.interactionAge[base + s] = 0xffffffff
      this.betrayalCount[base + s] = 0
      this.cooperationCount[base + s] = 0
    }
  }

  // Clear all references TO a dead blob from other blobs' memories
  clearRefsTo(deadId: number): void {
    for (let i = 0; i < MAX_BLOB_COUNT; i++) {
      const base = this.baseIdx(i)
      for (let s = 0; s < MAX_MEMORY_SLOTS; s++) {
        if (this.knownIds[base + s] === deadId) {
          this.knownIds[base + s] = 0
          this.interactionAge[base + s] = 0xffffffff
        }
      }
    }
  }

  getMemories(blobId: number): Array<{
    targetId: number
    trust: number
    betrayals: number
    cooperations: number
  }> {
    const base = this.baseIdx(blobId)
    const result = []
    for (let s = 0; s < MAX_MEMORY_SLOTS; s++) {
      if (this.interactionAge[base + s] !== 0xffffffff && this.knownIds[base + s] !== 0) {
        result.push({
          targetId: this.knownIds[base + s],
          trust: this.trustScores[base + s],
          betrayals: this.betrayalCount[base + s],
          cooperations: this.cooperationCount[base + s],
        })
      }
    }
    return result.sort((a, b) => Math.abs(b.trust) - Math.abs(a.trust))
  }
}
