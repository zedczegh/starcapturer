
/**
 * API utilities for making requests to external services
 */

// Define common API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com';

/**
 * Fetch clear sky rate data from API
 */
export async function fetchClearSkyRate(
  latitude: number, 
  longitude: number, 
  includeHistorical: boolean = true
): Promise<{
  annualRate: number;
  monthlyRates: Record<string, number>;
  clearestMonths: string[];
  confidence: number;
  dataSource: string;
}> {
  try {
    // In a real implementation, this would call an API
    // For now, returning mock data
    
    // Generate some realistic clear sky rates based on latitude
    const isNorthern = latitude >= 0;
    const baseRate = 50 + (Math.random() * 30 - 15);
    
    const monthlyRates: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Northern and Southern hemispheres have different seasonal patterns
    const seasonalPatterns = isNorthern 
      ? [5, 0, 10, 15, 20, 25, 25, 15, 10, 5, -5, -10] // Northern
      : [-10, -5, 0, 5, 10, 15, 20, 25, 15, 5, 0, -5]; // Southern
    
    // Generate monthly rates
    months.forEach((month, idx) => {
      const seasonalAdjustment = seasonalPatterns[idx];
      monthlyRates[month] = Math.min(100, Math.max(0, 
        Math.round(baseRate + seasonalAdjustment + (Math.random() * 10 - 5))
      ));
    });
    
    // Determine clearest months (top 3)
    const sortedMonths = [...months].sort(
      (a, b) => monthlyRates[b] - monthlyRates[a]
    );
    const clearestMonths = sortedMonths.slice(0, 3);
    
    return {
      annualRate: Math.round(baseRate),
      monthlyRates,
      clearestMonths,
      confidence: 0.75 + (Math.random() * 0.2),
      dataSource: 'Simulated Data'
    };
  } catch (error) {
    console.error("Error fetching clear sky rate:", error);
    throw error;
  }
}

/**
 * Generic API request function with error handling
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

/**
 * Weather data fetching
 */
export async function fetchWeatherData(
  params: { latitude: number; longitude: number }
): Promise<{
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  visibility?: number;
  weatherCondition?: string;
  aqi?: number;
}> {
  // Mock implementation - in a real app this would call a weather API
  return {
    temperature: 15 + Math.random() * 10 - 5,
    humidity: 40 + Math.random() * 40,
    cloudCover: Math.random() * 50,
    windSpeed: Math.random() * 20,
    precipitation: Math.random() * 5,
    visibility: 80 + Math.random() * 20,
    weatherCondition: Math.random() > 0.2 ? "Clear" : "Partly cloudy",
    aqi: 20 + Math.random() * 40
  };
}

/**
 * Light pollution data fetching
 */
export async function fetchLightPollutionData(
  latitude: number, 
  longitude: number
): Promise<{
  bortleScale: number;
  artificialBrightness?: number;
  lightIntensity?: number;
}> {
  // Mock implementation - in a real app this would call an API
  // Use latitude to slightly vary the Bortle scale (closer to equator = higher)
  const latitudeFactor = Math.abs(latitude) / 90; // 0 at equator, 1 at poles
  const bortleBase = 6 - (latitudeFactor * 3); // 6 at equator, 3 at poles
  
  // Add some randomness
  const bortleVariation = Math.random() * 2 - 1;
  
  // Ensure within valid Bortle range (1-9)
  const bortleScale = Math.max(1, Math.min(9, bortleBase + bortleVariation));
  
  return {
    bortleScale: Math.round(bortleScale * 10) / 10,
    artificialBrightness: (bortleScale - 1) * 0.2,
    lightIntensity: (bortleScale - 1) * 10
  };
}
