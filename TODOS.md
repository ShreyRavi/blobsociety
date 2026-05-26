# TODOS

## Post-v1
- [ ] Society Code UI — PRNG infra done in Week 2; UI post-v1 (fork/replay via base64 seed string)
- [ ] PWA installable (manifest.json + service worker)
- [ ] Web Workers (only if main-thread 60fps fails under profiling)
- [ ] Export/save slots (named save states in localStorage)
- [ ] Visual regression tests (canvas snapshot at tick 100, fixed seed)
- [ ] Biome texture (stretch: opacity 0.08 per biome — skip if canvas perf is tight)
- [ ] Society Code share button (URL hash param or clipboard)
- [ ] Tablet landscape layout

## Known Limitations (by design)
- Cross-browser float determinism not guaranteed — same-device only (by design)
- Replay/fork UI deferred until post-v1 (PRNG seed stored correctly from Week 2)
- Tablet landscape layout not designed for v1 (phone portrait is primary)
