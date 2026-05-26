// xoshiro256++ PRNG — deterministic, seeded, fast
// State: 4 × Uint32 (128 bits)

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0
}

export class PRNG {
  private s: Uint32Array

  constructor(seed: number) {
    this.s = new Uint32Array(4)
    // SplitMix32 to initialize state from seed
    let z = (seed >>> 0) + 0x9e3779b9
    const sm = (x: number): number => {
      x = (x ^ (x >>> 16)) >>> 0
      x = Math.imul(x, 0x85ebca6b) >>> 0
      x = (x ^ (x >>> 13)) >>> 0
      x = Math.imul(x, 0xc2b2ae35) >>> 0
      return (x ^ (x >>> 16)) >>> 0
    }
    this.s[0] = sm(z)
    z = (z + 0x9e3779b9) >>> 0
    this.s[1] = sm(z)
    z = (z + 0x9e3779b9) >>> 0
    this.s[2] = sm(z)
    z = (z + 0x9e3779b9) >>> 0
    this.s[3] = sm(z)
  }

  next(): number {
    const result = (rotl((this.s[0] + this.s[3]) >>> 0, 7) + this.s[0]) >>> 0
    const t = (this.s[1] << 9) >>> 0
    this.s[2] ^= this.s[0]
    this.s[3] ^= this.s[1]
    this.s[1] ^= this.s[2]
    this.s[0] ^= this.s[3]
    this.s[2] ^= t
    this.s[3] = rotl(this.s[3], 11)
    return result
  }

  // Returns float in [0, 1)
  nextFloat(): number {
    return (this.next() >>> 0) / 4294967296
  }

  // Returns float in [min, max)
  nextRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min)
  }

  // Gaussian via Box-Muller (uses 2 PRNG calls)
  nextGaussian(mean: number, sigma: number): number {
    const u1 = this.nextFloat() || 1e-10  // avoid log(0)
    const u2 = this.nextFloat()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + sigma * z
  }

  serializeState(): Uint32Array {
    return new Uint32Array(this.s)
  }

  restoreState(state: Uint32Array): void {
    this.s.set(state)
  }
}
