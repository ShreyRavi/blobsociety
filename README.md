# Blob Society

A real-time evolution simulation. Blobs eat, fight, reproduce, and go extinct. Watch natural selection play out in your browser.

## What it does

200 blobs spawn with randomized traits — speed, strength, diet, aggression, sociability, metabolism, and more. They perceive their environment, form emotions, remember interactions, and act accordingly. Species diverge through genetic drift. Populations collapse.

**Systems running each tick:**
- Pheromones (food trails, danger signals, territory marking, mating calls)
- Perception (spatial hash neighbor lookup)
- Emotions (fear, confidence, stress, curiosity)
- Memory (trust/fear relationships between individuals)
- Interactions (flee, hunt, share food, follow)
- Combat, Food foraging, Biome effects
- Reproduction (energy-gated, mutation, inheritance)
- Aging + speciation + world events

**Biomes:** Grassland, Forest, Desert, Toxic — each with different energy modifiers.

## Controls

| Input | Action |
|-------|--------|
| Click blob | Select — shows stats panel |
| `P` | Pause / Resume |
| `Escape` | Deselect blob |
| Speed slider | 1× – 10× simulation speed |
| Debug › Pheromone overlay | Visualize chemical signals |

## Stack

- **React + TypeScript** — UI layer only (stats, blob card, controls)
- **Canvas 2D** — all rendering, pinch-zoom/pan
- **Valtio** — reactive simulation state
- **Vite** — build + dev server
- **Vitest** — 119 unit tests across all ECS systems

## Development

```bash
npm install
npm run dev        # http://localhost:5173/blobsociety/
npm test           # run all 119 tests
npm run build      # production build → dist/
```

## Architecture

```
src/
├── engine/         # Core: StateBuffer (SoA typed arrays), PRNG, constants
├── systems/        # ECS systems: one update() per concern
│   └── __tests__/  # unit tests per system
├── renderer/       # CanvasRenderer + PinchZoom
├── store/          # Valtio sim state bridge
└── ui/             # React panels: StatsPanel, BlobCard, ControlSheet, DebugOverlay
```

State lives in `StateBuffer` — flat typed arrays (Float32Array, Uint8Array) for 33 fields across up to 256 blobs. Double-buffered: systems read from `readBuf`, write to `writeBuf`, swap each tick.

## License

MIT
