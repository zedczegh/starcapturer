
/**
 * Shared types for astro photography spots
 */

export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqs?: number;
  isViable?: boolean;
  distance?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  timestamp?: string;
  county?: string;
  state?: string;
  country?: string;
  description?: string;
  photographer?: string;
}

export interface AstroSpotQueryOptions {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  certifiedOnly?: boolean;
}

export interface SharingResponse {
  success: boolean;
  message: string;
  id?: string;
}

/**
 * Get recommended photo points near a location
 */
export const getRecommendedPhotoPoints = async (
  latitude: number,
  longitude: number,
  radius = 100,
  certifiedOnly = false,
  limit = 30
): Promise<SharedAstroSpot[]> => {
  try {
    console.log(`API: Getting photo points within ${radius}km of ${latitude}, ${longitude}`);
    
    // Import calculation points for locations since we don't have a real API
    const { getCalculationPointsNear } = await import('@/data/calculationPoints');
    
    // Get calculation points near the specified coordinates
    const calculatedPoints = await getCalculationPointsNear(latitude, longitude, radius);
    
    // Filter for certified only if requested
    const filteredPoints = certifiedOnly
      ? calculatedPoints.filter(p => p.isDarkSkyReserve || p.certification)
      : calculatedPoints;
    
    // Limit to requested number
    const limitedPoints = filteredPoints.slice(0, limit);
    
    console.log(`API: Found ${limitedPoints.length} photo points`);
    return limitedPoints;
  } catch (error) {
    console.error("Error fetching recommended photo points:", error);
    return [];
  }
};

/**
 * Get a shared astronomy spot by ID
 */
export const getSharedAstroSpot = async (id: string): Promise<SharedAstroSpot | null> => {
  try {
    // First check if we have it in localStorage
    const storedLocation = localStorage.getItem(`location_${id}`);
    if (storedLocation) {
      const locationData = JSON.parse(storedLocation);
      return {
        id,
        name: locationData.name,
        chineseName: locationData.chineseName,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        bortleScale: locationData.bortleScale || 4,
        siqs: locationData.siqs,
        county: locationData.county || "Sample County",
        state: locationData.state || "Sample State",
        country: locationData.country || "Sample Country",
        isDarkSkyReserve: locationData.isDarkSkyReserve,
        certification: locationData.certification
      };
    }
    
    // Fallback to mock implementation
    return {
      id,
      name: "Sample Astro Spot",
      latitude: 37.7749,
      longitude: -122.4194,
      bortleScale: 4,
      siqs: 7.2,
      county: "San Francisco County",
      state: "California",
      country: "United States"
    };
  } catch (error) {
    console.error("Error fetching shared astro spot:", error);
    return null;
  }
};

/**
 * Share an astronomy spot with the community
 */
export const shareAstroSpot = async (
  spotData: Omit<SharedAstroSpot, "id">
): Promise<SharingResponse> => {
  try {
    // Generate a unique ID
    const id = `spot-${Date.now()}`;
    
    // Store in localStorage for persistence
    const fullSpotData = {
      ...spotData,
      id,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`location_${id}`, JSON.stringify(fullSpotData));
    
    console.log("Shared astro spot saved:", fullSpotData);
    return {
      success: true,
      message: "Location shared successfully",
      id
    };
  } catch (error) {
    console.error("Error sharing astro spot:", error);
    return {
      success: false,
      message: "Failed to share location"
    };
  }
};
