
/**
 * Interface for shared astronomy spot data
 */
export interface SharedAstroSpot {
  id?: string;
  name?: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  timestamp?: string;
  certification?: string | null;
  isDarkSkyReserve?: boolean;
  bortleScale?: number;
  siqs?: number | { score: number; isViable: boolean };
  distance?: number;
  isViable?: boolean;
  preferenceScore?: number;
  // Forecast-specific fields
  isForecast?: boolean;
  forecastDate?: string;
  weatherData?: {
    cloudCover?: number;
    temperature?: number;
    windSpeed?: number;
    humidity?: number;
    precipitation?: number;
    weatherCode?: number;
  };
  // Additional fields
  type?: string;
  cloudCover?: number;
  timeInfo?: {
    isNighttime: boolean;
    timeUntilNight?: number;
    timeUntilDaylight?: number;
  };
  photographer?: string;
}

// Sharing response interface
export interface SharingResponse {
  success: boolean;
  id?: string;
  message?: string;
}

/**
 * Get recommended photo points near a location
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> {
  try {
    // In a real implementation, this would make an API call
    // For now, we'll just return an empty array
    console.log(`Getting recommended photo points near ${latitude}, ${longitude} with radius ${radius}km`);
    
    // Mock implementation
    return [];
  } catch (error) {
    console.error("Error fetching recommended photo points:", error);
    return [];
  }
}

/**
 * Get a specific shared astro spot by ID
 */
export async function getSharedAstroSpot(id: string): Promise<SharedAstroSpot | null> {
  try {
    // Mock implementation
    console.log(`Getting shared astro spot with ID: ${id}`);
    return null;
  } catch (error) {
    console.error("Error fetching shared astro spot:", error);
    return null;
  }
}

/**
 * Share a new astronomy spot
 */
export async function shareAstroSpot(spotData: Omit<SharedAstroSpot, "id">): Promise<SharingResponse> {
  try {
    // Mock implementation
    console.log("Sharing new astro spot:", spotData);
    
    return {
      success: true,
      id: `mocked-id-${Date.now()}`
    };
  } catch (error) {
    console.error("Error sharing astro spot:", error);
    return {
      success: false,
      message: (error as Error).message || "Unknown error"
    };
  }
}
