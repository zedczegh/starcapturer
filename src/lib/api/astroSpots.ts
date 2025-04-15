
export interface SharedAstroSpot {
  id?: string;
  name?: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  bortleScale?: number;
  siqs?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  isViable?: boolean;
  description?: string;
  timestamp?: string;
  date?: string;
  photographer?: string;
  siqsResult?: {
    score: number;
    isViable?: boolean;
    factors?: Array<any>;
  };
}

// Add the missing export interface for sharing response
export interface SharingResponse {
  success: boolean;
  id?: string;
  message?: string;
}

// Add the missing export functions that are referenced
export const getRecommendedPhotoPoints = async (
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> => {
  try {
    console.log(`Fetching recommended photo points for ${latitude}, ${longitude} with radius ${radius}km`);
    
    // In a real implementation, this would call an API
    // For now, we'll return some mock data for development
    return [];
  } catch (error) {
    console.error("Error fetching recommended photo points:", error);
    return [];
  }
};

export const getSharedAstroSpot = async (id: string): Promise<SharedAstroSpot | null> => {
  try {
    console.log(`Fetching shared astro spot with ID: ${id}`);
    // In a real implementation, this would call an API
    return null;
  } catch (error) {
    console.error("Error fetching shared astro spot:", error);
    return null;
  }
};

export const shareAstroSpot = async (spotData: Omit<SharedAstroSpot, "id">): Promise<SharingResponse> => {
  try {
    console.log("Sharing astro spot:", spotData);
    // In a real implementation, this would call an API
    return { 
      success: true, 
      id: `loc-${spotData.latitude.toFixed(6)}-${spotData.longitude.toFixed(6)}` 
    };
  } catch (error) {
    console.error("Error sharing astro spot:", error);
    return { 
      success: false, 
      message: (error as Error).message 
    };
  }
};

