import { useSyncExternalStore } from 'react'
import type { SimSnapshot } from '../engine/SimEngine'
import { getEngine } from '../engine/SimEngine'

// Latest snapshot — updated at 10Hz from engine
let latestSnapshot: SimSnapshot | null = null
const listeners = new Set<() => void>()

function notifyAll(): void {
  listeners.forEach(l => l())
}

// Wire engine → store on module load
getEngine().subscribe((snapshot) => {
  latestSnapshot = snapshot
  notifyAll()
})

function storeSubscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): SimSnapshot | null {
  return latestSnapshot
}

export function useSimSnapshot(): SimSnapshot | null {
  return useSyncExternalStore(storeSubscribe, getSnapshot)
}

// Selected blob state — not part of snapshot (UI-only)
let selectedBlobId: number | null = null
const selListeners = new Set<() => void>()

function getSelected(): number | null { return selectedBlobId }

export function selectBlob(id: number | null): void {
  selectedBlobId = id
  selListeners.forEach(l => l())
}

export function useSelectedBlob(): number | null {
  return useSyncExternalStore(
    (l) => { selListeners.add(l); return () => selListeners.delete(l) },
    getSelected,
  )
}

// Control helpers
export function setPaused(p: boolean): void {
  getEngine().setPaused(p)
}

export function setSpeed(s: number): void {
  getEngine().setSpeed(s)
}
