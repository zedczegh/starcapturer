
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
    // Mock data for now - in a real app, this would call an API
    const mockLocations: SharedAstroSpot[] = [
      {
        id: "spot1",
        name: "Dark Sky Reserve",
        latitude: latitude + 0.1,
        longitude: longitude + 0.1,
        bortleScale: 2,
        siqs: 8.5,
        isDarkSkyReserve: true,
        certification: "International Dark Sky Reserve",
        county: "Alpine County",
        state: "California",
        country: "United States",
        distance: 15
      },
      {
        id: "spot2",
        name: "Mountain Viewpoint",
        latitude: latitude - 0.2,
        longitude: longitude - 0.15,
        bortleScale: 3,
        siqs: 7.8,
        county: "Sierra County",
        state: "Nevada",
        country: "United States",
        distance: 25
      }
    ];
    
    return mockLocations;
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
    // Mock implementation
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
    // Mock implementation
    console.log("Sharing astro spot:", spotData);
    return {
      success: true,
      message: "Location shared successfully",
      id: `spot-${Date.now()}`
    };
  } catch (error) {
    console.error("Error sharing astro spot:", error);
    return {
      success: false,
      message: "Failed to share location"
    };
  }
};
