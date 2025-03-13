
import type { WeatherData, ForecastData, ForecastItem, SharedAstroSpot } from "@/types/weather";

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

// Generate Baidu Maps URL for navigation
export const generateBaiduMapsUrl = (latitude: number, longitude: number, name: string = ''): string => {
  // Ensure coordinates are properly formatted
  const lat = Number(latitude).toFixed(6);
  const lng = Number(longitude).toFixed(6);
  
  // Encode the location name for the URL
  const encodedName = encodeURIComponent(name || 'Selected Location');
  
  // Create a Baidu Maps URL
  return `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodedName}&content=${encodedName}&output=html`;
};

// Get recommended photo points based on user location
export const getRecommendedPhotoPoints = async (
  latitude: number,
  longitude: number
): Promise<SharedAstroSpot[]> => {
  try {
    // In a real implementation, this would fetch data from a server
    // For now, we'll generate mock data based on the user's location
    
    const spots: SharedAstroSpot[] = [
      {
        id: "spot1",
        name: "Mountain Viewpoint",
        latitude: latitude + 0.05,
        longitude: longitude + 0.05,
        description: "Excellent elevation with clear views of the horizon. Popular for Milky Way photography.",
        bortleScale: 3,
        photographer: "StarGazer42",
        photoUrl: "https://images.unsplash.com/photo-1527856263669-12c3a0af2aa6?w=800&auto=format&fit=crop",
        targets: ["Milky Way", "Andromeda"],
        siqs: 8.5,
        isViable: true,
        distance: calculateDistance(latitude, longitude, latitude + 0.05, longitude + 0.05)
      },
      {
        id: "spot2",
        name: "Lakeside Point",
        latitude: latitude - 0.03,
        longitude: longitude + 0.02,
        description: "Beautiful reflections on the lake surface. Good for wide-angle night landscapes.",
        bortleScale: 4,
        photographer: "NightSky",
        photoUrl: "https://images.unsplash.com/photo-1506318164473-2dfd3ede3623?w=800&auto=format&fit=crop",
        targets: ["Orion Nebula", "Pleiades"],
        siqs: 7.2,
        isViable: true,
        distance: calculateDistance(latitude, longitude, latitude - 0.03, longitude + 0.02)
      },
      {
        id: "spot3",
        name: "Desert Viewpoint",
        latitude: latitude + 0.01,
        longitude: longitude - 0.04,
        description: "No light pollution and clear skies most of the year. Perfect for deep sky objects.",
        bortleScale: 2,
        photographer: "AstroPhotographyLover",
        targets: ["Galaxies", "Nebulae"],
        siqs: 9.1,
        isViable: true,
        distance: calculateDistance(latitude, longitude, latitude + 0.01, longitude - 0.04)
      }
    ];
    
    // Sort by distance
    return spots.sort((a, b) => (a.distance || 999) - (b.distance || 999));
  } catch (error) {
    console.error("Error getting recommended photo points:", error);
    return [];
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  // Implementation of the Haversine formula to calculate distance between two points
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};

// Function to share an astronomy spot
export const shareAstroSpot = async (spot: SharedAstroSpot): Promise<void> => {
  // This would normally send data to a server
  // For now, we'll just log it and pretend it was successful
  console.log("Sharing astro spot:", spot);
  
  // In a real implementation, this would be an API call:
  // return fetch(`${BASE_API_URL}/spots`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(spot)
  // }).then(response => {
  //   if (!response.ok) throw new Error('Failed to share spot');
  //   return response.json();
  // });
  
  // Simulating async behavior
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
};

// Function to get shared astronomy spots
export const getSharedAstroSpots = async (
  latitude?: number,
  longitude?: number
): Promise<SharedAstroSpot[]> => {
  // This would normally fetch from a server
  // For demonstration, we'll return mock data
  const spots: SharedAstroSpot[] = [
    {
      id: "p1",
      name: "Eagle Peak Observatory",
      latitude: latitude ? latitude + 0.07 : 40.712776,
      longitude: longitude ? longitude - 0.03 : -74.005974,
      description: "High elevation with minimal light pollution. Great for deep sky objects.",
      bortleScale: 3,
      photographer: "AstroEnthusiast",
      photoUrl: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=800&auto=format&fit=crop",
      targets: ["Milky Way", "Andromeda Galaxy"],
      siqs: 8.7,
      isViable: true,
      timestamp: new Date().toISOString()
    },
    {
      id: "p2",
      name: "Coastal Horizon Point",
      latitude: latitude ? latitude - 0.05 : 34.052235,
      longitude: longitude ? longitude + 0.08 : -118.243683,
      description: "Beautiful ocean views with dark skies to the west.",
      bortleScale: 4,
      photographer: "NightSkyCaptures",
      photoUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&auto=format&fit=crop",
      targets: ["Planets", "Moon"],
      siqs: 7.2,
      isViable: true,
      timestamp: new Date().toISOString()
    },
    {
      id: "p3",
      name: "Desert Star Point",
      latitude: latitude ? latitude + 0.02 : 36.169941,
      longitude: longitude ? longitude - 0.07 : -115.139832,
      description: "Clear desert skies with minimal humidity. Perfect for galaxy photography.",
      bortleScale: 2,
      photographer: "StarTracker",
      photoUrl: "https://images.unsplash.com/photo-1509647924673-e4b2612d8358?w=800&auto=format&fit=crop",
      targets: ["Galaxies", "Nebulae"],
      siqs: 9.3,
      isViable: true,
      timestamp: new Date().toISOString()
    }
  ];
  
  // If we have user coordinates, calculate and add distances
  if (latitude && longitude) {
    spots.forEach(spot => {
      spot.distance = calculateDistance(
        latitude, 
        longitude, 
        spot.latitude, 
        spot.longitude
      );
    });
    
    // Sort by distance
    spots.sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }
  
  // Simulate async behavior
  return new Promise((resolve) => {
    setTimeout(() => resolve(spots), 1000);
  });
};
