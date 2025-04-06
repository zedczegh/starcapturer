
/**
 * API functions for clear sky rate data
 */

/**
 * Fetch clear sky rate for a location
 */
export async function fetchClearSkyRate(latitude: number, longitude: number): Promise<number | null> {
  try {
    // Mock implementation - would be replaced with actual API call
    // Generate a random clear sky rate between 0 and 100
    return Math.floor(Math.random() * 101);
  } catch (error) {
    console.error("Error fetching clear sky rate:", error);
    return null;
  }
}
