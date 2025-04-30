
// Add the forecast properties to the SharedAstroSpot interface
export interface SharedAstroSpot {
  id?: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
  timestamp?: string;
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
}

// Add the shareAstroSpot function
export const shareAstroSpot = async (spotData: Omit<SharedAstroSpot, 'id'>): Promise<{ success: boolean; id?: string; message?: string }> => {
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
