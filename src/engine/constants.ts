export const MAX_BLOB_COUNT = 256
export const INITIAL_BLOB_COUNT = 200
export const REPRODUCTION_SOFT_CAP = 230
export const MAX_FOOD_COUNT = 500
export const MAX_MEMORY_SLOTS = 32
export const MAX_VISION_RADIUS = 120
export const WORLD_W = 1000
export const WORLD_H = 1000
export const BIOME_COLS = 250
export const BIOME_ROWS = 250
export const PHERO_W = 100
export const PHERO_H = 100
export const PHERO_CHANNELS = 4
export const SPECIATION_INTERVAL = 60
export const SPECIATION_DISTANCE_THRESHOLD = 2.0
export const RAF_DT_MAX = 50
export const REPRODUCTION_THRESHOLD = 60
export const REPRODUCTION_COOLDOWN = 150
export const BASE_LIFESPAN = 3000
export const BASE_FOOD_RATE = 8
export const INITIAL_FOOD_COUNT = 300
export const MEMORY_SNAPSHOT_HZ = 6

// Biome IDs
export const BIOME_GRASSLAND = 0
export const BIOME_FOREST = 1
export const BIOME_DESERT = 2
export const BIOME_TOXIC = 3

// Pheromone channel indices
export const PHERO_FOOD = 0
export const PHERO_DANGER = 1
export const PHERO_TERRITORY = 2
export const PHERO_MATING = 3

// Diet thresholds (dietFloat ranges)
export const DIET_HERBIVORE_MAX = 0.25
export const DIET_OMNIVORE_MAX = 0.5
export const DIET_CARNIVORE_MAX = 0.75
// >= 0.75 = scavenger
export const DIET_HERBIVORE = 0
export const DIET_OMNIVORE = 1
export const DIET_CARNIVORE = 2
export const DIET_SCAVENGER = 3
