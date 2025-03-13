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
  // Handle values outside the -180 to 180 range
  let normalizedLongitude = longitude;
  while (normalizedLongitude > 180) {
    normalizedLongitude -= 360;
  }
  while (normalizedLongitude < -180) {
    normalizedLongitude += 360;
  }
  return normalizedLongitude;
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

interface ForecastData {
  hourly: {
    time: string[];
    temperature: number[];
    cloudCover: number[];
    precipitation: number[];
    windSpeed: number[];
    humidity: number[];
    weatherCode?: number[];
  };
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
export async function fetchWeatherData(coordinates: Coordinates): Promise<WeatherData | null> {
  try {
    const { latitude, longitude } = validateCoordinates(coordinates);
    
    // Fetch from Open-Meteo API
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&hourly=cloud_cover&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
    
    const data: WeatherResponse = await response.json();
    
    // Check if we have current data
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
      const aqiResponse = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
        `&current=european_aqi&domains=cams_global`
      );
      
      if (aqiResponse.ok) {
        const aqiData = await aqiResponse.json();
        if (aqiData.current && aqiData.current.european_aqi !== undefined) {
          weatherData.aqi = aqiData.current.european_aqi;
        }
      }
    } catch (aqiError) {
      console.error("Error fetching AQI data:", aqiError);
      // Continue without AQI data
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
export async function fetchForecastData(coordinates: Coordinates): Promise<ForecastData | null> {
  try {
    const { latitude, longitude, days = 3 } = validateCoordinates(coordinates);
    
    // Fetch from Open-Meteo API
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&forecast_days=${days}&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Forecast API responded with status ${response.status}`);
    }
    
    const data: WeatherResponse = await response.json();
    
    if (!data.hourly || !data.hourly.time || !data.hourly.temperature_2m || !data.hourly.cloud_cover) {
      throw new Error("Forecast data is missing required hourly fields");
    }
    
    // Transform data to our standard format
    const forecast: ForecastData = {
      hourly: {
        time: data.hourly.time,
        temperature: data.hourly.temperature_2m,
        cloudCover: data.hourly.cloud_cover,
        precipitation: data.hourly.precipitation,
        windSpeed: data.hourly.wind_speed_10m || data.hourly.windspeed_10m || new Array(data.hourly.time.length).fill(0),
        humidity: data.hourly.relative_humidity_2m || new Array(data.hourly.time.length).fill(0),
        weatherCode: data.hourly.weather_code
      }
    };
    
    return forecast;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    // Return null instead of throwing to allow graceful fallback
    return null;
  }
}

/**
 * Fetches light pollution data based on coordinates
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number } | null> {
  try {
    // Import the local database lookup function
    const { findClosestKnownLocation } = await import('../utils/bortleScaleEstimation');
    
    // Get Bortle scale from our local database
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    console.log(`Found location for Bortle scale: ${closestLocation.name}, Bortle: ${closestLocation.bortleScale}, Distance: ${closestLocation.distance.toFixed(2)}km`);
    
    return { bortleScale: closestLocation.bortleScale };

    // Real API call would look like this:
    /*
    const response = await fetch(`https://api.example.com/light-pollution?lat=${latitude}&lon=${longitude}`);
    if (!response.ok) {
      throw new Error(`Light pollution API error: ${response.status}`);
    }
    const data = await response.json();
    return { bortleScale: data.bortleScale };
    */
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Use our improved Bortle scale estimation
    const { findClosestKnownLocation } = await import('../utils/bortleScaleEstimation');
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
  const distance = R * c;  // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Get a location name from coordinates using reverse geocoding
 */
export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // First use our local database
    const { findClosestKnownLocation } = await import('../utils/bortleScaleEstimation');
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    
    // If we found a location within 20km, use its name
    if (closestLocation.distance <= 20) {
      console.log(`Using location from database: ${closestLocation.name} (${closestLocation.distance.toFixed(2)}km away)`);
      return closestLocation.name;
    }
    
    // If not found in our database or too far, fall back to Tianditu API
    const { getTiandituLocationName } = await import('../utils/tiandituApi');
    return getTiandituLocationName(latitude, longitude, language);
  } catch (error) {
    console.error('Error getting location name:', error);
    return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  }
}

/**
 * Interface for shared astronomy spots
 */
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  bortleScale: number;
  date: string;
  userId?: string;
  username?: string;
  likes?: number;
  distance?: number;
  siqs?: number;
  photoUrl?: string;
  photographer?: string;
  targets?: string[];
  isViable?: boolean;
  timestamp?: string;
}

/**
 * Shares an astronomy spot to the database
 */
export async function shareAstroSpot(spotData: Omit<SharedAstroSpot, 'id' | 'date'>): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Currently using a mock function until we have a real backend
    console.log('Sharing astro spot:', spotData);
    
    // Mock success response
    return {
      success: true,
      id: Date.now().toString(),
      message: 'Location shared successfully!'
    };
  } catch (error) {
    console.error('Error sharing astro spot:', error);
    return {
      success: false,
      message: 'Failed to share location. Please try again.'
    };
  }
}

/**
 * Gets nearby shared astronomy spots
 */
export async function getSharedAstroSpots(
  latitude: number,
  longitude: number,
  limit = 50,
  radius = 100  // km
): Promise<SharedAstroSpot[]> {
  try {
    // Mock implementation until we have a real backend
    const mockSpots: SharedAstroSpot[] = [
      {
        id: '1',
        name: 'Dark Sky Reserve',
        latitude: latitude + 0.1,
        longitude: longitude + 0.1,
        description: 'Excellent dark sky site with minimal light pollution. Great for deep sky objects.',
        bortleScale: 2,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'AstroEnthusiast',
        likes: 42
      },
      {
        id: '2',
        name: 'Mountain Lookout',
        latitude: latitude - 0.15,
        longitude: longitude - 0.05,
        description: 'High elevation site with clear horizons. Perfect for planets and lunar observation.',
        bortleScale: 3,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'StarGazer',
        likes: 28
      },
      {
        id: '3',
        name: 'Coastal Viewing Point',
        latitude: latitude + 0.2,
        longitude: longitude - 0.2,
        description: 'Open view of the western horizon over the water. Good for sunset and early evening viewing.',
        bortleScale: 4,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'MilkyWayHunter',
        likes: 15
      }
    ];
    
    // Add distance calculation
    const spotsWithDistance = mockSpots.map(spot => ({
      ...spot,
      distance: calculateDistance(latitude, longitude, spot.latitude, spot.longitude)
    }));
    
    // Filter by radius and sort by distance
    return spotsWithDistance
      .filter(spot => spot.distance <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching shared spots:', error);
    return [];
  }
}

/**
 * Gets recommended photo spots for a location
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  limit = 5
): Promise<SharedAstroSpot[]> {
  // For now, this is similar to getSharedAstroSpots but with a smaller limit
  return getSharedAstroSpots(latitude, longitude, limit);
}

/**
 * Generates a URL for directions to a location
 */
export function generateBaiduMapsUrl(latitude: number, longitude: number, name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://api.map.baidu.com/direction?origin=latlng:${latitude},${longitude}|name:Current&destination=name:${encodedName}&mode=driving&coord_type=wgs84&output=html`;
}
