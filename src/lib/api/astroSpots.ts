
// SharedAstroSpot type definition with all required properties
export interface SharedAstroSpot {
  id?: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  bortleScale?: number;
  siqs?: number;
  isViable?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  date?: string;
  timestamp?: string;
  factors?: any[]; // For storing SIQS calculation factors
  description?: string; // Adding missing description property
  photographer?: string; // Adding photographer property
  cloudCover?: number; // Adding cloudCover property
}

// Define sharing response type
export interface SharingResponse {
  success: boolean;
  message?: string;
  id?: string;
}

// Implementation of shareAstroSpot function
export async function shareAstroSpot(spot: Omit<SharedAstroSpot, 'id'>): Promise<SharingResponse> {
  try {
    console.log("Sharing astro spot:", spot);
    // Simulate API call with a successful response
    // In a real implementation, this would make an API request to your backend
    return {
      success: true,
      message: "Location shared successfully",
      id: `shared-${Date.now()}`
    };
  } catch (error) {
    console.error("Error sharing astro spot:", error);
    return {
      success: false,
      message: "Failed to share location"
    };
  }
}

// Implementation of getSharedAstroSpot function
export async function getSharedAstroSpot(id: string): Promise<SharedAstroSpot | null> {
  try {
    console.log("Getting shared astro spot:", id);
    // Simulate API call - in real implementation, this would fetch from your backend
    return {
      id,
      name: "Sample Astro Spot",
      latitude: 40.7128,
      longitude: -74.006,
      bortleScale: 4,
      siqs: 7.5,
      isDarkSkyReserve: false,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting shared astro spot:", error);
    return null;
  }
}

// Implementation of getRecommendedPhotoPoints function
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  radius: number = 100,
  certifiedOnly: boolean = false,
  limit: number = 20
): Promise<SharedAstroSpot[]> {
  try {
    console.log(`Getting recommended photo points: lat=${latitude}, lng=${longitude}, radius=${radius}km, certifiedOnly=${certifiedOnly}`);
    
    // Simulate API call with some sample data
    // In a real implementation, this would get data from your backend
    const samplePoints: SharedAstroSpot[] = [
      {
        id: "sample-1",
        name: "Dark Sky Park",
        latitude: latitude + 0.05,
        longitude: longitude + 0.05,
        bortleScale: 2,
        siqs: 8.5,
        isDarkSkyReserve: true,
        certification: "International Dark Sky Park",
        distance: 8.7,
        timestamp: new Date().toISOString()
      },
      {
        id: "sample-2",
        name: "Mountain Viewpoint",
        latitude: latitude - 0.03,
        longitude: longitude - 0.07,
        bortleScale: 3,
        siqs: 7.2,
        distance: 12.3,
        timestamp: new Date().toISOString()
      }
    ];
    
    // Add more simulated points for a realistic response
    for (let i = 0; i < 8; i++) {
      const randomDistance = Math.random() * radius;
      const randomDir1 = (Math.random() - 0.5) * 0.2;
      const randomDir2 = (Math.random() - 0.5) * 0.2;
      
      samplePoints.push({
        id: `sample-${i + 3}`,
        name: `Location ${i + 1}`,
        latitude: latitude + randomDir1,
        longitude: longitude + randomDir2,
        bortleScale: Math.floor(Math.random() * 6) + 2,
        siqs: Math.round((10 - (Math.random() * 4 + 2)) * 10) / 10,
        isDarkSkyReserve: i % 5 === 0,
        certification: i % 5 === 0 ? "Dark Sky Reserve" : undefined,
        distance: randomDistance,
        timestamp: new Date().toISOString()
      });
    }
    
    // Filter for certified locations if requested
    const filteredPoints = certifiedOnly
      ? samplePoints.filter(point => point.isDarkSkyReserve || point.certification)
      : samplePoints;
    
    // Sort by distance and limit results
    return filteredPoints
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting recommended photo points:", error);
    return [];
  }
}
