
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

// Add placeholder for fetchWeatherData if it's missing
export async function fetchWeatherData(coords: { latitude: number; longitude: number }): Promise<any> {
  try {
    // Mock weather data
    return {
      temperature: 15 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      cloudCover: Math.random() * 100,
      windSpeed: 5 + Math.random() * 15,
      condition: "Partly Cloudy",
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}
