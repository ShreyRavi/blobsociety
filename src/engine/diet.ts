import {
  DIET_HERBIVORE_MAX,
  DIET_OMNIVORE_MAX,
  DIET_CARNIVORE_MAX,
  DIET_HERBIVORE,
  DIET_OMNIVORE,
  DIET_CARNIVORE,
  DIET_SCAVENGER,
} from './constants'

export function deriveDiet(dietFloat: number): number {
  if (dietFloat < DIET_HERBIVORE_MAX) return DIET_HERBIVORE
  if (dietFloat < DIET_OMNIVORE_MAX)  return DIET_OMNIVORE
  if (dietFloat < DIET_CARNIVORE_MAX) return DIET_CARNIVORE
  return DIET_SCAVENGER
}
