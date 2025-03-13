
export interface Coordinates {
  latitude: number;
  longitude: number;
  days?: number;
}

// Validates and corrects coordinates to ensure they're within valid ranges
function validateCoordinates(coordinates: Coordinates): Coordinates {
  const { latitude, longitude, days } = coordinates;
  
  const validLatitude = Math.max(-90, Math.min(90, latitude));
  const validLongitude = normalizeLongitude(longitude);
  
  return {
    latitude: validLatitude,
    longitude: validLongitude,
    days
  };
}

// Normalizes longitude to the range [-180, 180]
function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

interface WeatherResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    cloud_cover: number;
    wind_speed_10m: number;
    weather_code: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    cloud_cover: number[];
    weather_code?: number[];
    precipitation: number[];
    windspeed_10m?: number[];
    wind_speed_10m?: number[];
    relative_humidity_2m?: number[];
  };
}

interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition: string;
  weatherCondition?: string;
  aqi?: number;
}

// Weather code mapping to text descriptions
const weatherConditions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

export function determineWeatherCondition(cloudCover: number): string {
  if (cloudCover < 10) return "Clear";
  if (cloudCover < 30) return "Mostly Clear";
  if (cloudCover < 60) return "Partly Cloudy";
  if (cloudCover < 80) return "Mostly Cloudy";
  return "Overcast";
}

/**
 * Fetches current weather data for a specific location
 */
export async function fetchWeatherData(coordinates: Coordinates, signal?: AbortSignal): Promise<WeatherData | null> {
  try {
    const { latitude, longitude } = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&hourly=cloud_cover&timezone=auto`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
    
    const data: WeatherResponse = await response.json();
    
    if (!data.current) {
      throw new Error("Weather data format missing 'current' field");
    }
    
    // Create standardized weather data object
    const weatherData: WeatherData = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      cloudCover: data.current.cloud_cover,
      windSpeed: data.current.wind_speed_10m,
      precipitation: data.current.precipitation,
      time: data.current.time,
      condition: weatherConditions[data.current.weather_code] || determineWeatherCondition(data.current.cloud_cover),
      weatherCondition: weatherConditions[data.current.weather_code] || "",
    };
    
    // Try to fetch AQI data
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
                    `&current=european_aqi&domains=cams_global`;
      
      const aqiResponse = await fetch(aqiUrl, { signal });
      
      if (aqiResponse.ok) {
        const aqiData = await aqiResponse.json();
        if (aqiData.current && aqiData.current.european_aqi !== undefined) {
          weatherData.aqi = aqiData.current.european_aqi;
        }
      }
    } catch (aqiError) {
      console.error("Error fetching AQI data:", aqiError);
    }
    
    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

/**
 * Fetches forecast data for a specific location
 */
export async function fetchForecastData(coordinates: Coordinates, signal?: AbortSignal): Promise<any | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&forecast_days=${validCoords.days || 3}&timezone=auto`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Forecast API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

/**
 * Fetches long range forecast data for a specific location
 */
export async function fetchLongRangeForecastData(coordinates: Coordinates, signal?: AbortSignal): Promise<any | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,` +
      `wind_speed_10m_max,relative_humidity_2m_mean,cloud_cover_mean` +
      `&forecast_days=${validCoords.days || 16}&timezone=auto`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Long range forecast API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Long range forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching long range forecast data:", error);
    return null;
  }
}

/**
 * Fetches light pollution data based on coordinates
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number } | null> {
  try {
    // Import the local database lookup function
    const { findClosestKnownLocation } = await import('../utils/locationUtils');
    
    // Get Bortle scale from our local database
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    
    return { bortleScale: closestLocation.bortleScale };
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Use our improved Bortle scale estimation as fallback
    const { findClosestKnownLocation } = await import('../utils/locationUtils');
    const estimatedBortleScale = findClosestKnownLocation(latitude, longitude).bortleScale;
    return { bortleScale: estimatedBortleScale };
  }
}

/**
 * Calculate distance between two points in km using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;  // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;  // Distance in km
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Enhanced function to get location name from coordinates
 * Now with better name resolution for places beyond Beijing and Hong Kong
 */
export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // Normalize coordinates
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = normalizeLongitude(longitude);
    
    // First try open API for reverse geocoding
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&accept-language=${language}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SIQSCalculatorApp'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          // Extract the most relevant part (city or region)
          const parts = data.display_name.split(',');
          const cityOrRegion = parts.length > 1 ? parts[0].trim() : data.display_name;
          
          return cityOrRegion;
        }
      }
    } catch (error) {
      console.error("Error using Nominatim API:", error);
    }
    
    // Fallback to our database
    const { findClosestKnownLocation } = await import('../utils/locationUtils');
    const closestLocation = findClosestKnownLocation(validLat, validLng);
    
    // If we're close to a known location, use its name or "Near X"
    if (closestLocation.distance <= 20) {
      return closestLocation.name;
    } else if (closestLocation.distance <= 100) {
      return language === 'en' 
        ? `Near ${closestLocation.name}` 
        : `${closestLocation.name}附近`;
    }
    
    // Last resort - use major city or region names based on approximate location
    const china = {
      north: ["Beijing Region", "北京地区"],
      northeast: ["Northeast China", "中国东北"],
      east: ["East China", "中国东部"],
      south: ["South China", "中国南部"],
      central: ["Central China", "中国中部"],
      west: ["Western China", "中国西部"],
      northwest: ["Northwest China", "中国西北"],
      southwest: ["Southwest China", "中国西南"],
    };
    
    // Simple region determination based on coordinates
    let region;
    if (validLat > 40) {
      if (validLng < 110) region = china.northwest;
      else region = china.northeast;
    } else if (validLat > 30) {
      if (validLng < 105) region = china.west;
      else if (validLng > 118) region = china.east;
      else region = china.central;
    } else {
      if (validLng < 105) region = china.southwest;
      else region = china.south;
    }
    
    return language === 'en' ? region[0] : region[1];
  } catch (error) {
    console.error('Error getting location name:', error);
    return language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` 
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
}

// Export other functions related to shared astronomy spots
export * from './api/astroSpots';
