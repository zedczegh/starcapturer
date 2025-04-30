
// Simplified forecast service for demonstration
// In a real application, this would connect to a weather API

/**
 * Get weather forecast for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Forecast data
 */
export const getForecast = async (
  latitude: number, 
  longitude: number
): Promise<any> => {
  try {
    // This is a mock implementation - in a real app, you would call an actual weather API
    console.log(`Getting forecast for ${latitude}, ${longitude}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock forecast data for 7 days
    const today = new Date();
    const daily = {
      time: Array.from({length: 7}, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date.toISOString().split('T')[0];
      }),
      cloudcover: Array.from({length: 7}, () => Math.random()), // 0-1 scale
      temperature_2m_max: Array.from({length: 7}, () => Math.floor(15 + Math.random() * 15)), // 15-30°C
      temperature_2m_min: Array.from({length: 7}, () => Math.floor(5 + Math.random() * 10)), // 5-15°C
      precipitation_sum: Array.from({length: 7}, () => Math.random() * 5), // 0-5mm
      windspeed_10m_max: Array.from({length: 7}, () => Math.random() * 20) // 0-20 km/h
    };
    
    return {
      latitude,
      longitude,
      daily
    };
  } catch (error) {
    console.error("Error fetching forecast:", error);
    throw error;
  }
};
