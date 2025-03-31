
// Re-export services for environmental data
export * from './weatherService';

// Add centralized cache management
let weatherCacheSize = 0;

/**
 * Get the current size of the weather cache
 */
export function getWeatherCacheSize(): number {
  return weatherCacheSize;
}

/**
 * Update tracked cache size
 */
export function updateWeatherCacheSize(size: number): void {
  weatherCacheSize = size;
}

/**
 * Clear all environmental data caches
 */
export function clearAllEnvironmentalCaches(): void {
  try {
    // Clear session storage cache for weather and forecast data
    let count = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('weather-') || key.startsWith('forecast-'))) {
        sessionStorage.removeItem(key);
        count++;
      }
    }
    console.log(`Cleared ${count} environmental data cache entries`);
    weatherCacheSize = 0;
  } catch (e) {
    console.error("Error clearing environmental data caches:", e);
  }
}
