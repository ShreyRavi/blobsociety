export type ActionType =
  | 'flee'
  | 'forage'
  | 'hunt'
  | 'follow'
  | 'fight'
  | 'share'
  | 'explore'
  | 'wander'

export interface InteractionLogEntry {
  actorId: number
  targetId: number
  action: ActionType
  tick: number
  energyDelta: number
}

export class InteractionLog {
  entries: InteractionLogEntry[] = []

  clear(): void {
    this.entries.length = 0
  }

  log(entry: InteractionLogEntry): void {
    this.entries.push(entry)
  }
}
