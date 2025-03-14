
import { calculateDistance } from '@/data/utils/distanceCalculator';

/**
 * Interface for shared astronomy spots
 */
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  bortleScale: number;
  date: string;
  userId?: string;
  username?: string;
  likes?: number;
  distance?: number;
  siqs?: number;
  photoUrl?: string;
  photographer?: string;
  targets?: string[];
  isViable?: boolean;
  timestamp?: string;
}

/**
 * Shares an astronomy spot to the database
 */
export async function shareAstroSpot(spotData: Omit<SharedAstroSpot, 'id' | 'date'>): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Currently using a mock function until we have a real backend
    console.log('Sharing astro spot:', spotData);
    
    // Mock success response
    return {
      success: true,
      id: Date.now().toString(),
      message: 'Location shared successfully!'
    };
  } catch (error) {
    console.error('Error sharing astro spot:', error);
    return {
      success: false,
      message: 'Failed to share location. Please try again.'
    };
  }
}

/**
 * Gets real locations within the search radius around the given coordinates
 * These are sampling points across various geographic locations
 */
export async function getSharedAstroSpots(
  latitude: number,
  longitude: number,
  limit = 50,
  radius = 100  // km
): Promise<SharedAstroSpot[]> {
  try {
    // Real sampling points distributed across different geographical regions
    // Based on known good viewing locations for astronomy
    const realLocations = [
      // Dark sky preserves and astronomy spots in various regions
      { name: "Zhangbei Grassland Observatory", latitude: 41.1582, longitude: 114.7022, bortleScale: 3 },
      { name: "Wudalianchi Dark Sky Park", latitude: 48.7205, longitude: 126.1987, bortleScale: 2 },
      { name: "Nagchu Highland", latitude: 31.4769, longitude: 92.0510, bortleScale: 1 },
      { name: "Arxan Dark Sky", latitude: 47.1893, longitude: 120.4103, bortleScale: 2 },
      { name: "Qilian Mountains", latitude: 38.1917, longitude: 99.7953, bortleScale: 2 },
      { name: "Kanas Lake Viewpoint", latitude: 48.7303, longitude: 87.0244, bortleScale: 1 },
      { name: "Changbai Mountain", latitude: 41.9806, longitude: 128.0854, bortleScale: 3 },
      { name: "Dunhuang Desert", latitude: 40.1425, longitude: 94.6617, bortleScale: 1 },
      { name: "Ngari Observatory", latitude: 32.3157, longitude: 80.0701, bortleScale: 1 },
      { name: "Qinghai Lake Viewing Point", latitude: 36.8257, longitude: 100.1893, bortleScale: 2 },
      { name: "Lugu Lake Hills", latitude: 27.7048, longitude: 100.7985, bortleScale: 3 },
      { name: "Jade Dragon Mountain", latitude: 27.1014, longitude: 100.1772, bortleScale: 2 },
      { name: "Xishuangbanna Tropical Sky", latitude: 22.0112, longitude: 100.7927, bortleScale: 3 },
      { name: "Altay Mountains", latitude: 47.8456, longitude: 88.1427, bortleScale: 1 },
      { name: "Namtso Lake", latitude: 30.7081, longitude: 90.5516, bortleScale: 1 },
      // Add low to mid-elevation locations
      { name: "Wuyuan Rural Viewpoint", latitude: 29.2483, longitude: 117.8614, bortleScale: 4 },
      { name: "Lushan Mountain", latitude: 29.5657, longitude: 115.9875, bortleScale: 3 },
      { name: "Xinglong Observatory", latitude: 40.3958, longitude: 117.5777, bortleScale: 3 },
      { name: "Mount Emei", latitude: 29.5249, longitude: 103.3323, bortleScale: 3 },
      { name: "Zhangjiajie Heights", latitude: 29.1324, longitude: 110.4793, bortleScale: 3 },
      { name: "Yellow Mountain", latitude: 30.1314, longitude: 118.1631, bortleScale: 3 },
      { name: "Daocheng Yading", latitude: 29.0254, longitude: 100.3035, bortleScale: 2 },
      { name: "Mount Tai", latitude: 36.2610, longitude: 117.1097, bortleScale: 4 },
      // Additional locations with varying bortle scales
      { name: "Taihu Lake Observatory", latitude: 31.1897, longitude: 120.1390, bortleScale: 5 },
      { name: "Hainan Tropical Island", latitude: 19.2097, longitude: 109.7540, bortleScale: 4 },
      { name: "Xisha Islands", latitude: 16.8338, longitude: 112.3377, bortleScale: 2 },
      { name: "Dinghu Mountain", latitude: 23.1723, longitude: 112.5511, bortleScale: 4 },
      { name: "Wuyi Mountains", latitude: 27.7559, longitude: 117.6746, bortleScale: 3 },
      { name: "Dahinggan Mountains", latitude: 50.2434, longitude: 124.1954, bortleScale: 2 },
      { name: "Western Desert View", latitude: 39.4547, longitude: 75.9792, bortleScale: 1 },
      { name: "Inner Mongolia Grassland", latitude: 44.0833, longitude: 113.9427, bortleScale: 2 },
      { name: "Lhasa Mountains", latitude: 29.6500, longitude: 91.1000, bortleScale: 3 },
      { name: "Yamdrok Lake", latitude: 29.3620, longitude: 90.9722, bortleScale: 2 },
      { name: "Mount Kailash", latitude: 31.0793, longitude: 81.3119, bortleScale: 1 },
      { name: "Taklamakan Desert Edge", latitude: 40.2018, longitude: 83.5498, bortleScale: 1 },
      { name: "Taklimakan Desert", latitude: 38.8604, longitude: 83.4784, bortleScale: 1 },
      { name: "Daxing'anling Forest", latitude: 51.6731, longitude: 124.3336, bortleScale: 2 },
      { name: "Guilin Hills", latitude: 25.2736, longitude: 110.2900, bortleScale: 4 },
      { name: "Yading Nature Reserve", latitude: 28.4845, longitude: 100.3327, bortleScale: 2 },
      { name: "Nujiang Canyon", latitude: 27.7300, longitude: 98.8500, bortleScale: 3 },
      { name: "Xiata Forest Viewpoint", latitude: 43.5998, longitude: 85.6143, bortleScale: 2 },
      // International locations for users traveling
      { name: "Mauna Kea", latitude: 19.8208, longitude: -155.4680, bortleScale: 1 },
      { name: "Atacama Desert", latitude: -23.4500, longitude: -68.2000, bortleScale: 1 },
      { name: "Namibian Desert", latitude: -24.7270, longitude: 15.3350, bortleScale: 1 },
      { name: "Australian Outback", latitude: -25.3444, longitude: 131.0369, bortleScale: 1 },
      { name: "Death Valley", latitude: 36.5323, longitude: -116.9325, bortleScale: 2 },
      { name: "La Palma Observatory", latitude: 28.7636, longitude: -17.8947, bortleScale: 2 },
      { name: "Pic du Midi", latitude: 42.9372, longitude: 0.1419, bortleScale: 2 },
      { name: "NamibRand Dark Sky Reserve", latitude: -25.0400, longitude: 16.0200, bortleScale: 1 },
      { name: "Aoraki Mackenzie", latitude: -43.7340, longitude: 170.0966, bortleScale: 1 },
      { name: "Cherry Springs State Park", latitude: 41.6626, longitude: -77.8223, bortleScale: 2 }
    ];
    
    // Calculate distance for each location and filter by radius
    const locationsWithDistance = realLocations.map(location => ({
      ...location,
      id: `loc-${location.latitude}-${location.longitude}`, // Generate deterministic ID
      description: `Astronomical observation location with Bortle ${location.bortleScale}`,
      date: new Date().toISOString(),
      distance: calculateDistance(latitude, longitude, location.latitude, location.longitude)
    }));
    
    // Filter by distance and sort by closest
    return locationsWithDistance
      .filter(location => location.distance !== undefined && location.distance <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching shared spots:', error);
    return [];
  }
}

/**
 * Gets recommended photo spots for a location
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  limit = 5
): Promise<SharedAstroSpot[]> {
  // For now, this is similar to getSharedAstroSpots but with a smaller limit
  return getSharedAstroSpots(latitude, longitude, limit);
}

/**
 * Generates a URL for directions to a location
 */
export function generateBaiduMapsUrl(latitude: number, longitude: number, name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://api.map.baidu.com/direction?origin=latlng:${latitude},${longitude}|name:Current&destination=name:${encodedName}&mode=driving&coord_type=wgs84&output=html`;
}
