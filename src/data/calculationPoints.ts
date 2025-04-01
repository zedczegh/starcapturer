
/**
 * Provides calculation points for locations when real data isn't available
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getLocationDetailsById } from '@/utils/locationStorage';

// Default fallback points in case no real data is available
const fallbackPoints: SharedAstroSpot[] = [
  {
    id: 'cp-1',
    name: 'Mountain Observatory',
    chineseName: '山区天文台',
    latitude: 40.7128,
    longitude: -74.0060,
    bortleScale: 3,
    isDarkSkyReserve: false
  },
  {
    id: 'cp-2',
    name: 'Desert Viewpoint',
    chineseName: '沙漠观景点',
    latitude: 37.7749,
    longitude: -122.4194,
    bortleScale: 2,
    isDarkSkyReserve: false
  },
  {
    id: 'cp-3',
    name: 'Dark Sky Park',
    chineseName: '暗夜公园',
    latitude: 34.0522,
    longitude: -118.2437,
    bortleScale: 4,
    certification: 'International Dark Sky Park',
    isDarkSkyReserve: true
  }
];

/**
 * Get calculation points for astronomy locations
 * This function is used when real API data isn't available
 */
export const getCalculationPoints = async (): Promise<SharedAstroSpot[]> => {
  try {
    // First check if we have any locally saved locations
    const localPoints: SharedAstroSpot[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('location_')) {
        const id = key.replace('location_', '');
        const pointData = getLocationDetailsById(id);
        
        if (pointData) {
          localPoints.push({
            id,
            name: pointData.name,
            chineseName: pointData.chineseName,
            latitude: pointData.latitude,
            longitude: pointData.longitude,
            bortleScale: pointData.bortleScale || 4,
            isDarkSkyReserve: pointData.isDarkSkyReserve || false,
            certification: pointData.certification
          });
        }
      }
    }
    
    // Try to load from mock API
    const { getRecommendedPhotoPoints } = await import('@/lib/api/astroSpots');
    
    // Combine results
    let combinedPoints = [...localPoints];
    
    if (combinedPoints.length === 0) {
      // No local points, fall back to mockup data
      combinedPoints = fallbackPoints;
    }
    
    return combinedPoints;
  } catch (error) {
    console.error("Error loading calculation points:", error);
    return fallbackPoints;
  }
};

/**
 * Get calculation points near a specific location
 */
export const getCalculationPointsNear = async (
  latitude: number, 
  longitude: number,
  radius: number = 100
): Promise<SharedAstroSpot[]> => {
  try {
    const points = await getCalculationPoints();
    
    // Add fake calculation points around the given location
    const nearbyPoints: SharedAstroSpot[] = [];
    
    // Create some synthetic points around the provided coordinates
    for (let i = 0; i < 5; i++) {
      // Create points at different distances and directions
      const distance = (Math.random() * radius * 0.8) + (radius * 0.2);
      const angle = Math.random() * Math.PI * 2;
      
      // Convert distance (in km) to degrees (very rough approximation)
      const latOffset = (distance / 111) * Math.cos(angle);
      const lonOffset = (distance / 111) * Math.sin(angle) / Math.cos(latitude * Math.PI / 180);
      
      const newLat = latitude + latOffset;
      const newLon = longitude + lonOffset;
      
      // Randomize Bortle scale between 2-6
      const bortleScale = Math.floor(Math.random() * 5) + 2;
      
      nearbyPoints.push({
        id: `calc-${i}-${Date.now()}`,
        name: `Viewpoint ${i+1}`,
        chineseName: `观察点 ${i+1}`,
        latitude: newLat,
        longitude: newLon,
        bortleScale,
        distance,
        isDarkSkyReserve: i === 0, // Make one location a dark sky reserve
        certification: i === 0 ? 'Calculated Dark Sky Area' : undefined
      });
    }
    
    return [...points, ...nearbyPoints];
  } catch (error) {
    console.error("Error creating calculation points near location:", error);
    return [];
  }
};
