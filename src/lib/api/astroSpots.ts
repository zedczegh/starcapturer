
export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqs?: number;
  siqsScore?: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
  isViable?: boolean;
  distance?: number;
  timestamp?: string;
  // Forecast-related properties
  isForecast?: boolean;
  forecastDay?: number;
  forecastData?: {
    cloudCover: number;
    precipitationProbability: number;
    day: number;
  };
}

export interface SharingResponse {
  success: boolean;
  id?: string;
  message?: string;
}

/**
 * Get a shared astronomy spot by ID
 */
export async function getSharedAstroSpot(id: string): Promise<SharedAstroSpot | null> {
  try {
    const response = await fetch(`/api/astro-spots/${id}`);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching shared astro spot:", error);
    return null;
  }
}

/**
 * Share an astronomy spot
 */
export async function shareAstroSpot(spot: Omit<SharedAstroSpot, "id">): Promise<SharingResponse> {
  try {
    const response = await fetch('/api/astro-spots/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spot)
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sharing astro spot:", error);
    return {
      success: false,
      message: "Failed to share location"
    };
  }
}

/**
 * Get recommended photo points near coordinates
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 20
): Promise<SharedAstroSpot[]> {
  try {
    const url = `/api/photo-points?lat=${latitude}&lng=${longitude}&radius=${radius}&certifiedOnly=${certifiedOnly}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching recommended photo points:", error);
    return [];
  }
}
