
// Re-export weather service functions
export * from './weatherService';

/**
 * Get the appropriate weather icon based on weather conditions
 */
export const getWeatherIcon = (weatherCode: number, isNight: boolean = false) => {
  // Map weather codes to icon names
  switch (weatherCode) {
    case 0: // Clear sky
      return isNight ? "moon" : "sun";
    case 1: // Mainly clear
    case 2: // Partly cloudy
      return isNight ? "cloud-moon" : "cloud-sun";
    case 3: // Overcast
      return "cloud";
    case 45: // Fog
    case 48: // Depositing rime fog
      return "cloud-fog";
    case 51: // Light drizzle
    case 53: // Moderate drizzle
    case 55: // Dense drizzle
      return "cloud-drizzle";
    case 56: // Light freezing drizzle
    case 57: // Dense freezing drizzle
      return "cloud-hail";
    case 61: // Slight rain
    case 63: // Moderate rain
    case 65: // Heavy rain
      return "cloud-rain";
    case 66: // Light freezing rain
    case 67: // Heavy freezing rain
      return "cloud-snow";
    case 71: // Slight snow fall
    case 73: // Moderate snow fall
    case 75: // Heavy snow fall
    case 77: // Snow grains
      return "cloud-snow";
    case 80: // Slight rain showers
    case 81: // Moderate rain showers
    case 82: // Violent rain showers
      return "cloud-rain";
    case 85: // Slight snow showers
    case 86: // Heavy snow showers
      return "cloud-snow";
    case 95: // Thunderstorm
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      return "cloud-lightning";
    default:
      return isNight ? "moon" : "sun";
  }
};

/**
 * Determine if a weather condition is suitable for astrophotography
 */
export const isWeatherSuitableForAstrophotography = (
  cloudCover: number,
  precipitation: number,
  windSpeed: number
): boolean => {
  // Cloud cover should be below 40%
  // No precipitation
  // Wind speed should be below 20 km/h
  return cloudCover < 40 && precipitation < 0.1 && windSpeed < 20;
};

/**
 * Calculates quality score for astrophotography based on current conditions
 * Returns a score from 0-10
 */
export const calculateAstrophotographyQuality = (
  cloudCover: number,
  bortleScale: number,
  moonPhase: number = 0.5,
  humidity: number = 50
): number => {
  // If cloud cover is too high, return 0
  if (cloudCover >= 40) return 0;
  
  // Base score affected by cloud cover (0-10)
  const cloudScore = Math.max(0, 10 - (cloudCover * 0.25));
  
  // Bortle scale effect (1-9, lower is better)
  // Scale from 0-3 penalty
  const bortlePenalty = Math.min(3, Math.max(0, (bortleScale - 1) / 2.66));
  
  // Moon phase effect (0-1, lower is better for deep sky)
  // Full moon (0.5) has maximum negative impact
  const moonImpact = Math.abs(moonPhase - 0) * 2;
  const moonPenalty = moonImpact * 2;
  
  // Humidity effect (high humidity can reduce clarity)
  const humidityPenalty = humidity > 80 ? 1 : 0;
  
  // Calculate final score
  let finalScore = cloudScore - bortlePenalty - moonPenalty - humidityPenalty;
  
  // Ensure score is between 0-10
  return Math.min(10, Math.max(0, finalScore));
};
