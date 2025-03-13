
import type { WeatherData, ForecastData, ForecastItem } from "@/types/weather";

const BASE_API_URL = "https://weather-api-proxy.azurewebsites.net";

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string): never => {
  console.error(`API Error: ${defaultMessage}`, error);
  throw new Error(defaultMessage);
};

// Timeout promise for fetch requests
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const fetchWeatherData = async ({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<WeatherData | null> => {
  try {
    // Create fetch URL
    const url = `${BASE_API_URL}/weather?lat=${latitude}&lon=${longitude}`;
    
    // Attempt to fetch with timeout
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Weather data received:", data);

    // Extract and normalize weather data
    const weatherData: WeatherData = {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      cloudCover: data.clouds?.all || 0,
      windSpeed: data.wind?.speed || 0,
      precipitation: data.rain?.["1h"] || data.snow?.["1h"] || 0,
      time: new Date().toISOString(),
      condition: determineWeatherCondition(data.clouds?.all || 0, data.weather?.[0]?.main),
      aqi: data.aqi || null, // Include AQI if available
      weatherCondition: data.weather?.[0]?.main || null
    };

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    // Return null instead of throwing to allow app to continue with degraded functionality
    return null;
  }
};

// Function to determine weather condition
export const determineWeatherCondition = (cloudCover: number, conditionCode?: string): string => {
  if (conditionCode) {
    const normalizedCode = conditionCode.toLowerCase();
    
    if (normalizedCode.includes("rain") || normalizedCode.includes("drizzle")) {
      return "Rainy";
    }
    if (normalizedCode.includes("snow")) {
      return "Snowy";
    }
    if (normalizedCode.includes("thunder") || normalizedCode.includes("storm")) {
      return "Stormy";
    }
    if (normalizedCode.includes("fog") || normalizedCode.includes("mist") || normalizedCode.includes("haze")) {
      return "Foggy";
    }
  }
  
  // Fallback to cloud cover if no condition code provided
  if (cloudCover >= 85) {
    return "Overcast";
  } else if (cloudCover >= 50) {
    return "Partly Cloudy";
  } else {
    return "Clear";
  }
};

export const fetchForecastData = async ({
  latitude,
  longitude,
  days = 3
}: {
  latitude: number;
  longitude: number;
  days?: number;
}): Promise<ForecastData | null> => {
  try {
    // Create fetch URL with days parameter for extended forecasts
    const url = `${BASE_API_URL}/forecast?lat=${latitude}&lon=${longitude}&days=${days}`;
    
    // Attempt fetch with timeout
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Forecast data received:", data);

    // Process the forecast data
    let forecastItems: ForecastItem[] = [];
    
    if (Array.isArray(data.list)) {
      forecastItems = data.list.map((item: any) => ({
        time: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        cloudCover: item.clouds?.all || 0,
        windSpeed: item.wind?.speed || 0,
        precipitation: item.pop || 0, // Probability of precipitation
        condition: determineWeatherCondition(item.clouds?.all || 0, item.weather?.[0]?.main),
        weatherIcon: item.weather?.[0]?.icon || "01d"
      }));
    }

    return {
      items: forecastItems,
      location: {
        name: data.city?.name || "Unknown Location",
        country: data.city?.country || "Unknown Country"
      }
    };
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    // Return null instead of throwing to allow app to continue with degraded functionality
    return null;
  }
};

// Function to get location name from coordinates using reverse geocoding
export const getLocationNameFromCoordinates = async (
  latitude: number, 
  longitude: number,
  language: 'en' | 'zh' = 'en'
): Promise<string> => {
  try {
    // Try using custom reverse geocoding API first
    const url = `${BASE_API_URL}/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=${language}`;
    
    // Custom timeout for geocoding requests
    const response = await fetchWithTimeout(url, {}, 8000);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Geocoding data received:", data);

    // Extract location name from response
    if (data.name) {
      return data.name;
    }
    
    // Fallback to OSM if our API doesn't return a name
    throw new Error("Location name not found in response");
  } catch (error) {
    console.error("Error with primary geocoding service, trying fallback:", error);
    
    // Fallback to OSM Nominatim for non-China regions
    try {
      // Use OSM Nominatim as fallback (works outside China)
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`;
      
      const osmResponse = await fetchWithTimeout(osmUrl, {
        headers: { 'User-Agent': 'AstroSIQS/1.0' }
      }, 6000);
      
      if (!osmResponse.ok) {
        throw new Error(`OSM HTTP error! status: ${osmResponse.status}`);
      }
      
      const osmData = await osmResponse.json();
      
      // Extract meaningful location name from OSM data
      if (osmData.address) {
        const parts = [];
        
        // Build location string based on available address components
        if (osmData.address.village) parts.push(osmData.address.village);
        else if (osmData.address.town) parts.push(osmData.address.town);
        else if (osmData.address.city) parts.push(osmData.address.city);
        else if (osmData.address.county) parts.push(osmData.address.county);
        
        if (osmData.address.state || osmData.address.province) {
          parts.push(osmData.address.state || osmData.address.province);
        }
        
        if (parts.length > 0) {
          return parts.join(", ");
        }
      }
      
      if (osmData.display_name) {
        // Return first part of display name (most specific)
        return osmData.display_name.split(',')[0].trim();
      }
      
      throw new Error("Could not extract location name from OSM data");
    } catch (osmError) {
      console.error("Error with OSM fallback, using coordinates as location name:", osmError);
      
      // Final fallback - return coordinates as string
      const ns = latitude >= 0 ? 'N' : 'S';
      const ew = longitude >= 0 ? 'E' : 'W';
      
      return language === 'en' 
        ? `Location at ${Math.abs(latitude).toFixed(4)}°${ns}, ${Math.abs(longitude).toFixed(4)}°${ew}`
        : `位置：${Math.abs(latitude).toFixed(4)}°${ns}, ${Math.abs(longitude).toFixed(4)}°${ew}`;
    }
  }
};

// Function to fetch light pollution data (Bortle scale) for a location
export const fetchLightPollutionData = async (
  latitude: number, 
  longitude: number
): Promise<{ bortleScale: number } | null> => {
  try {
    // Create fetch URL for light pollution data
    const url = `${BASE_API_URL}/lightpollution?lat=${latitude}&lon=${longitude}`;
    
    // Attempt fetch with timeout
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Light pollution data received:", data);

    // Validate received data
    if (typeof data.bortleScale !== 'number') {
      throw new Error("Invalid light pollution data format");
    }

    return {
      bortleScale: Math.max(1, Math.min(9, Math.round(data.bortleScale)))
    };
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    
    // Fallback: estimate Bortle scale based on location
    return estimateBortleScale(latitude, longitude);
  }
};

// Fallback function to estimate Bortle scale based on location
const estimateBortleScale = (
  latitude: number, 
  longitude: number
): { bortleScale: number } | null => {
  try {
    // Simple estimation based on coordinates
    // This is a very rough estimation only used when API fails
    // Could be improved with more accurate datasets
    
    // Check if location is in a known urban area
    // Major cities approximate coordinates and radii (in degrees)
    const majorCities = [
      { name: "Beijing", lat: 39.9, lng: 116.4, radius: 0.5, bortle: 8 },
      { name: "Shanghai", lat: 31.2, lng: 121.5, radius: 0.5, bortle: 8 },
      { name: "Tokyo", lat: 35.7, lng: 139.8, radius: 0.5, bortle: 9 },
      { name: "New York", lat: 40.7, lng: -74.0, radius: 0.3, bortle: 9 },
      { name: "London", lat: 51.5, lng: 0.1, radius: 0.3, bortle: 8 },
      { name: "Paris", lat: 48.9, lng: 2.3, radius: 0.3, bortle: 8 },
      { name: "Los Angeles", lat: 34.1, lng: -118.2, radius: 0.5, bortle: 8 },
      // Add more major cities as needed
    ];
    
    // Check if coordinates are within a major city
    for (const city of majorCities) {
      const distance = Math.sqrt(
        Math.pow(latitude - city.lat, 2) + 
        Math.pow(longitude - city.lng, 2)
      );
      
      if (distance <= city.radius) {
        return { bortleScale: city.bortle };
      }
    }
    
    // Fallback based on general region
    // This is very approximate and should be replaced with better estimation
    
    // Large urban regions tend to have high light pollution
    // Estimate based on proximity to urban centers
    
    // Simplified approach - default to moderately dark (Bortle 4)
    return { bortleScale: 4 };
  } catch (error) {
    console.error("Error in Bortle scale estimation:", error);
    // Default to Bortle 5 (suburban sky) if estimation fails
    return { bortleScale: 5 };
  }
};
