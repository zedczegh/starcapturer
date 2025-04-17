
/**
 * Shared location data structure used across the application
 */
export interface SharedAstroSpot {
  id?: string;
  name?: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  description?: string;
  bortleScale?: number;
  siqs?: number | { score: number; isViable: boolean };
  siqsResult?: any;
  distance?: number;
  timestamp?: string;
  date?: string;
  lastVisit?: string;
  isDarkSkyReserve?: boolean;
  certification?: string;
  image?: string;
  [key: string]: any; // Allow arbitrary additional properties
}

export interface SharingResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Fetch recommended photo points for astrophotography
 */
export async function getRecommendedPhotoPoints(
  latitude: number, 
  longitude: number, 
  radius: number = 100
): Promise<SharedAstroSpot[]> {
  // In a real app, this would be an API call
  console.log(`Fetching recommended photo points near ${latitude}, ${longitude} within ${radius}km`);
  
  // Return a mock response for now
  return [
    {
      id: "astro-1",
      name: "Mountain Viewpoint",
      latitude: latitude + 0.05,
      longitude: longitude + 0.05,
      bortleScale: 3,
      description: "Great dark sky location with minimal light pollution",
      timestamp: new Date().toISOString(),
      siqs: 7.5,
      distance: 5.2
    },
    {
      id: "astro-2",
      name: "Lakeside Observatory",
      latitude: latitude - 0.07,
      longitude: longitude + 0.03,
      bortleScale: 2,
      description: "Perfect for astrophotography with clear horizons",
      timestamp: new Date().toISOString(),
      siqs: 8.2,
      distance: 7.8,
      isDarkSkyReserve: true
    }
  ];
}

/**
 * Get details of a shared astronomy spot
 */
export async function getSharedAstroSpot(id: string): Promise<SharedAstroSpot | null> {
  console.log(`Fetching details for astro spot with ID: ${id}`);
  
  // Mock implementation - in a real app, this would contact an API
  return {
    id,
    name: "Sample Location",
    latitude: 40.7128,
    longitude: -74.0060,
    bortleScale: 4,
    description: "A sample location for demonstration",
    timestamp: new Date().toISOString(),
    siqs: 6.5,
    isDarkSkyReserve: false
  };
}

/**
 * Share an astronomy spot with other users
 */
export async function shareAstroSpot(locationData: SharedAstroSpot): Promise<SharingResponse> {
  console.log("Sharing location:", locationData);
  
  // Mock implementation - in a real app, this would be an API call
  return {
    success: true,
    message: "Location shared successfully",
    data: {
      id: `shared-${Date.now()}`,
      ...locationData
    }
  };
}
