
/**
 * Weather data interface
 */
export interface WeatherData {
  temperature: number;
  cloudCover: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  aqi?: number;
  isNight: boolean;
  moonPhase?: number;
  precipitationProbability: number;
}

/**
 * Generate random but realistic weather data for demo purposes
 */
const generateRealisticWeather = (): WeatherData => {
  // Generate moonphase (0-1, where 0 is new moon, 0.5 is full moon, 1 is new moon again)
  const moonPhase = Math.random();
  
  // Generate cloud cover (0-100%)
  const cloudCover = Math.floor(Math.random() * 100);
  
  // Generate precipitation probability (0-100%)
  // Higher cloud cover increases chances of precipitation
  const precipitationProbability = cloudCover > 60 
    ? Math.min(100, cloudCover + Math.floor(Math.random() * 30))
    : Math.floor(Math.random() * cloudCover);
  
  // Generate temperature (0-30°C)
  const temperature = Math.floor(Math.random() * 30);
  
  // Generate humidity (30-100%)
  // Higher precipitation probability means higher humidity
  const humidity = 30 + Math.floor(Math.random() * 70);
  
  // Generate wind speed (0-30 km/h)
  const windSpeed = Math.floor(Math.random() * 30);
  
  // Generate visibility (0-20 km)
  // Lower cloud cover and precipitation means better visibility
  const visibility = Math.max(1, 20 - (cloudCover / 10) - (precipitationProbability / 20));
  
  // Generate AQI (0-200)
  const aqi = Math.floor(Math.random() * 150);
  
  // Determine if it's night (for demo purposes, 50% chance)
  const isNight = Math.random() > 0.5;
  
  return {
    temperature,
    cloudCover,
    humidity,
    windSpeed,
    visibility,
    aqi,
    isNight,
    moonPhase,
    precipitationProbability
  };
};

/**
 * Get current weather data for a location
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise with weather data
 */
export const getCurrentWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  // Check session storage cache first
  const cacheKey = `weather-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Error parsing cached weather:", e);
    }
  }
  
  // For demo purposes, generate realistic random weather
  const weather = generateRealisticWeather();
  
  // Cache the result
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(weather));
  } catch (e) {
    console.error("Error caching weather data:", e);
  }
  
  return weather;
};
