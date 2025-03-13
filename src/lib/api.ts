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
    // Use more accurate Bortle scale estimation
    const estimatedBortleScale = getImprovedBortleScale(latitude, longitude);
    return { bortleScale: estimatedBortleScale };

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
    // Return fallback value
    return { bortleScale: getImprovedBortleScale(latitude, longitude) };
  }
}

/**
 * Improved Bortle scale estimation based on latitude/longitude and geographical features
 * This provides more accurate results compared to the previous implementation
 */
function getImprovedBortleScale(latitude: number, longitude: number): number {
  // Major urban centers with high light pollution (Bortle 8-9)
  const majorCities = [
    { lat: 40.7128, lon: -74.0060, name: "New York", bortle: 8.5, radius: 50 },        // New York
    { lat: 34.0522, lon: -118.2437, name: "Los Angeles", bortle: 8.4, radius: 45 },    // Los Angeles
    { lat: 39.9042, lon: 116.4074, name: "Beijing", bortle: 8.7, radius: 50 },         // Beijing
    { lat: 31.2304, lon: 121.4737, name: "Shanghai", bortle: 8.8, radius: 50 },        // Shanghai
    { lat: 19.4326, lon: -99.1332, name: "Mexico City", bortle: 8.6, radius: 45 },     // Mexico City
    { lat: 35.6762, lon: 139.6503, name: "Tokyo", bortle: 8.9, radius: 55 },           // Tokyo
    { lat: 51.5074, lon: -0.1278, name: "London", bortle: 8.3, radius: 40 },           // London
    { lat: 48.8566, lon: 2.3522, name: "Paris", bortle: 8.2, radius: 40 },             // Paris
    { lat: 28.6139, lon: 77.2090, name: "Delhi", bortle: 8.6, radius: 45 },            // Delhi
    { lat: 55.7558, lon: 37.6173, name: "Moscow", bortle: 8.3, radius: 45 },           // Moscow
    { lat: 37.7749, lon: -122.4194, name: "San Francisco", bortle: 8.0, radius: 35 },  // San Francisco
    { lat: 41.8781, lon: -87.6298, name: "Chicago", bortle: 8.2, radius: 40 },         // Chicago
    { lat: 22.3193, lon: 114.1694, name: "Hong Kong", bortle: 8.7, radius: 30 },       // Hong Kong
    { lat: 1.3521, lon: 103.8198, name: "Singapore", bortle: 8.5, radius: 30 },        // Singapore
    { lat: 25.0330, lon: 121.5654, name: "Taipei", bortle: 7.4, radius: 25 },          // Taipei
    { lat: 3.1390, lon: 101.6869, name: "Kuala Lumpur", bortle: 7.3, radius: 30 },     // Kuala Lumpur
    { lat: 14.5995, lon: 120.9842, name: "Manila", bortle: 7.6, radius: 30 },          // Manila
    { lat: 13.7563, lon: 100.2864, name: "Bangkok", bortle: 7.5, radius: 30 }          // Bangkok
  ];
  
  // Smaller cities and suburban areas (Bortle 6-7)
  const smallerCities = [
    { lat: 47.6062, lon: -122.3321, name: "Seattle", bortle: 7.5, radius: 25 },        // Seattle
    { lat: 30.2672, lon: -97.7431, name: "Austin", bortle: 7.0, radius: 20 },          // Austin
    { lat: 43.6532, lon: -79.3832, name: "Toronto", bortle: 7.3, radius: 30 },         // Toronto
    { lat: 45.5017, lon: -73.5673, name: "Montreal", bortle: 7.2, radius: 30 },        // Montreal
    { lat: 52.5200, lon: 13.4050, name: "Berlin", bortle: 7.1, radius: 25 },           // Berlin
    { lat: 59.3293, lon: 18.0686, name: "Stockholm", bortle: 6.8, radius: 20 },        // Stockholm
    { lat: 37.9838, lon: 23.7275, name: "Athens", bortle: 7.0, radius: 25 },           // Athens
    { lat: 34.6937, lon: 135.5023, name: "Osaka", bortle: 7.5, radius: 30 },           // Osaka
    { lat: 6.9271, lon: 79.8612, name: "Colombo", bortle: 6.9, radius: 20 },           // Colombo
    { lat: 25.0330, lon: 121.5654, name: "Taipei", bortle: 7.4, radius: 25 },          // Taipei
    { lat: 3.1390, lon: 101.6869, name: "Kuala Lumpur", bortle: 7.3, radius: 30 },     // Kuala Lumpur
    { lat: 14.5995, lon: 120.9842, name: "Manila", bortle: 7.6, radius: 30 },          // Manila
    { lat: 13.7563, lon: 100.2864, name: "Bangkok", bortle: 7.5, radius: 30 }          // Bangkok
  ];
  
  // Dark sky reserves and rural areas (Bortle 1-3)
  const darkSkyAreas = [
    { lat: 38.9332, lon: -114.2687, name: "Great Basin", bortle: 1.0, radius: 50 },    // Great Basin National Park
    { lat: 29.2498, lon: -103.2502, name: "Big Bend", bortle: 1.2, radius: 45 },       // Big Bend National Park
    { lat: 40.3428, lon: -105.6836, name: "Rocky Mountain", bortle: 2.5, radius: 30 }, // Rocky Mountain National Park
    { lat: 44.4280, lon: -110.5885, name: "Yellowstone", bortle: 2.0, radius: 40 },    // Yellowstone
    { lat: 36.1069, lon: -112.1129, name: "Grand Canyon", bortle: 2.2, radius: 30 },   // Grand Canyon
    { lat: 37.7331, lon: -119.5874, name: "Yosemite", bortle: 2.8, radius: 25 },       // Yosemite
    { lat: 51.1788, lon: -115.5708, name: "Banff", bortle: 2.0, radius: 30 },          // Banff National Park
    { lat: -43.5321, lon: 170.3865, name: "New Zealand Alps", bortle: 1.5, radius: 40 }, // New Zealand Southern Alps
    { lat: -25.3444, lon: 131.0369, name: "Uluru", bortle: 1.0, radius: 60 },          // Uluru Australia
    { lat: 27.9881, lon: 86.9250, name: "Everest Region", bortle: 1.8, radius: 50 },   // Everest Region
    { lat: -20.7359, lon: 139.4962, name: "Australian Outback", bortle: 1.0, radius: 100 }, // Australian Outback
    { lat: 23.4241, lon: -110.2864, name: "Baja California", bortle: 2.0, radius: 40 },     // Baja California
    { lat: 77.8750, lon: -166.0528, name: "Antarctica", bortle: 1.0, radius: 200 }          // Antarctica
  ];
  
  // Calculate distances to all reference points
  let closestCity = { distance: Number.MAX_VALUE, bortle: 5, gradientFactor: 0.02 };
  let closestSmallCity = { distance: Number.MAX_VALUE, bortle: 5, gradientFactor: 0.03 };
  let closestDarkSky = { distance: Number.MAX_VALUE, bortle: 5, gradientFactor: 0.01 };
  
  // Check against major cities
  for (const city of majorCities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lon);
    if (distance < closestCity.distance) {
      const gradientFactor = 0.02; // How quickly the Bortle scale reduces with distance
      closestCity = { distance, bortle: city.bortle, gradientFactor };
    }
  }
  
  // Check against smaller cities
  for (const city of smallerCities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lon);
    if (distance < closestSmallCity.distance) {
      const gradientFactor = 0.03; // Slightly faster reduction for smaller cities
      closestSmallCity = { distance, bortle: city.bortle, gradientFactor };
    }
  }
  
  // Check against dark sky areas
  for (const area of darkSkyAreas) {
    const distance = calculateDistance(latitude, longitude, area.lat, area.lon);
    if (distance < closestDarkSky.distance) {
      const gradientFactor = 0.01; // Slower increase in Bortle scale as you leave dark areas
      closestDarkSky = { distance, bortle: area.bortle, gradientFactor };
    }
  }
  
  // Calculate Bortle scale values from each reference point
  let bortleFromCity = calculateBortleAtDistance(closestCity.bortle, closestCity.distance, closestCity.gradientFactor);
  let bortleFromSmallCity = calculateBortleAtDistance(closestSmallCity.bortle, closestSmallCity.distance, closestSmallCity.gradientFactor);
  let bortleFromDarkSky = calculateBortleAtDistance(closestDarkSky.bortle, closestDarkSky.distance, closestDarkSky.gradientFactor);
  
  // Take the median value to avoid extreme values
  const bortleValues = [bortleFromCity, bortleFromSmallCity, bortleFromDarkSky].sort((a, b) => a - b);
  const medianBortle = bortleValues[1];
  
  // Ensure the result is in the valid range of 1-9
  return Math.max(1, Math.min(9, Math.round(medianBortle * 10) / 10));
}

/**
 * Calculate how the Bortle scale changes with distance from a reference point
 */
function calculateBortleAtDistance(baseBortle: number, distanceKm: number, gradientFactor: number): number {
  if (distanceKm <= 5) {
    return baseBortle; // Within 5km, use exact value
  }
  
  // Beyond the reference distance, calculate using exponential decay/growth
  if (baseBortle > 5) {
    // For bright areas (Bortle > 5), decrease with distance
    return 5 + (baseBortle - 5) * Math.exp(-gradientFactor * (distanceKm - 5));
  } else {
    // For dark areas (Bortle <= 5), increase with distance
    return 5 - (5 - baseBortle) * Math.exp(-gradientFactor * (distanceKm - 5));
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
    // Import the Tianditu API function
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

