
/**
 * Random utility functions for generating values
 */

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generate a random boolean with specified probability of being true
 */
export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Select a random item from an array
 */
export function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random ID string
 */
export function randomId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Add random variation to a base value (within percentage range)
 */
export function addVariation(baseValue: number, percentVariation: number): number {
  const variation = (Math.random() * 2 - 1) * percentVariation;
  return baseValue * (1 + variation);
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generate a random floating point number between min and max
 */
export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
