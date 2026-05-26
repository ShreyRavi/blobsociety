import type { StateBuffer } from './StateBuffer'
import type { SimEngine } from './SimEngine'

export interface System {
  name: string
  enabled: boolean
  update(read: StateBuffer, write: StateBuffer, engine: SimEngine, phase?: string): void
}

export interface SystemRegistration {
  system: System
  phase?: string
}
