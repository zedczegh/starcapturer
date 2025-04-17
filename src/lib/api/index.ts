
/**
 * API services index
 */

export * from './astroSpots';

// Air quality data fetching
export async function fetchAirQualityData(latitude: number, longitude: number): Promise<any> {
  try {
    // This is a mock implementation
    // In a real app, this would call an actual air quality API
    const mockAqi = Math.floor(30 + Math.random() * 50); // Generate a value between 30-80
    
    return {
      aqi: mockAqi,
      category: mockAqi < 50 ? "Good" : mockAqi < 100 ? "Moderate" : "Unhealthy",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    return null;
  }
}
