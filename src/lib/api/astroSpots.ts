
// Add the forecast properties to the SharedAstroSpot interface
export interface SharedAstroSpot {
  id: string; // Required field
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale: number; // Required for type compatibility
  certification?: string;
  isDarkSkyReserve?: boolean;
  timestamp: string; // Changed from optional to required
  siqsTimestamp?: string;
  siqs?: number | { score: number; isViable: boolean };
  isViable?: boolean;
  distance?: number;
  imageUrl?: string;
  createdBy?: string;
  userDisplayName?: string;
  description?: string;
  type?: string;
  photographer?: string;
  
  // Forecast-specific properties
  isForecast?: boolean;
  forecastDay?: number;
  forecastDate?: string;
  cloudCover?: number;
  
  // Additional properties that might be needed by other components
  timeInfo?: {
    isNighttime: boolean;
    timeUntilNight?: number;
    timeUntilDaylight?: number;
  };
}

// Export interface for sharing response
export interface SharingResponse {
  success: boolean;
  id?: string;
  message?: string;
}

// Add the shareAstroSpot function
export const shareAstroSpot = async (spotData: Omit<SharedAstroSpot, 'id'>): Promise<SharingResponse> => {
  try {
    // This is a mock implementation. In a real app, this would make an API call to your backend.
    console.log('Sharing astro spot:', spotData);
    
    // Simulate successful response
    return {
      success: true,
      id: `spot-${Date.now()}`,
    };
  } catch (error) {
    console.error('Error sharing astro spot:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Add the getRecommendedPhotoPoints function that's being imported
export const getRecommendedPhotoPoints = async (
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> => {
  // For now, return a mock implementation that returns an empty array
  // In a real app, this would fetch data from an API
  console.log(`Fetching photo points within ${radius}km of [${latitude}, ${longitude}]`);
  
  // Mock data for testing
  const mockData: SharedAstroSpot[] = [
    {
      id: 'certified-1',
      name: 'Certified Location 1',
      latitude: latitude + 0.1,
      longitude: longitude + 0.1,
      bortleScale: 2,
      certification: 'Dark Sky Reserve',
      isDarkSkyReserve: true,
      timestamp: new Date().toISOString(),
      siqs: 85,
      distance: 10,
    },
    {
      id: 'calculated-1',
      name: 'Calculated Location 1',
      latitude: latitude - 0.05,
      longitude: longitude - 0.05,
      bortleScale: 3,
      timestamp: new Date().toISOString(),
      siqs: 75,
      distance: 5,
    },
  ];
  
  // Filter if certified only
  const result = certifiedOnly ? 
    mockData.filter(item => item.isDarkSkyReserve || item.certification) : 
    mockData;
    
  return result.slice(0, limit);
};

// Add the getSharedAstroSpot function
export const getSharedAstroSpot = async (id: string): Promise<SharedAstroSpot | null> => {
  // This would typically be an API call to fetch a specific spot by ID
  console.log(`Fetching shared astro spot with ID: ${id}`);
  
  // Mock implementation for now
  return {
    id,
    name: `Shared Location ${id}`,
    latitude: 34.5,
    longitude: -118.2,
    bortleScale: 3,
    timestamp: new Date().toISOString(),
    siqs: 80,
    description: 'This is a shared astronomy spot for testing.',
    type: 'dark-site'
  };
};
