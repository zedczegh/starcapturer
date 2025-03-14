
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
 * Gets nearby shared astronomy spots
 */
export async function getSharedAstroSpots(
  latitude: number,
  longitude: number,
  limit = 50,
  radius = 100  // km
): Promise<SharedAstroSpot[]> {
  try {
    // Mock implementation until we have a real backend
    const mockSpots: SharedAstroSpot[] = [
      {
        id: '1',
        name: 'Dark Sky Reserve',
        latitude: latitude + 0.1,
        longitude: longitude + 0.1,
        description: 'Excellent dark sky site with minimal light pollution. Great for deep sky objects.',
        bortleScale: 2,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'AstroEnthusiast',
        likes: 42,
        siqs: 8.7,
        photoUrl: 'https://images.unsplash.com/photo-1533814105051-a3b23d6bf538?q=80&w=1000',
        photographer: 'StarHunter',
        isViable: true
      },
      {
        id: '2',
        name: 'Mountain Lookout',
        latitude: latitude - 0.15,
        longitude: longitude - 0.05,
        description: 'High elevation site with clear horizons. Perfect for planets and lunar observation.',
        bortleScale: 3,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'StarGazer',
        likes: 28,
        siqs: 7.5,
        photoUrl: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=1000',
        photographer: 'GalaxyGlimpser',
        isViable: true
      },
      {
        id: '3',
        name: 'Coastal Viewing Point',
        latitude: latitude + 0.2,
        longitude: longitude - 0.2,
        description: 'Open view of the western horizon over the water. Good for sunset and early evening viewing.',
        bortleScale: 4,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'MilkyWayHunter',
        likes: 15,
        siqs: 6.3,
        photoUrl: 'https://images.unsplash.com/photo-1518406432532-9cbef5697723?q=80&w=1000',
        photographer: 'NightSkyWatcher',
        isViable: true
      },
      {
        id: '4',
        name: 'Desert Observatory',
        latitude: latitude - 0.3,
        longitude: longitude + 0.3,
        description: 'Remote desert location with exceptional atmospheric stability. Ideal for planetary imaging.',
        bortleScale: 2,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'CosmicExplorer',
        likes: 36,
        siqs: 9.1,
        photoUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1000',
        photographer: 'AstroVoyager',
        isViable: true
      },
      {
        id: '5',
        name: 'National Park Clearing',
        latitude: latitude + 0.45,
        longitude: longitude - 0.35,
        description: 'Protected dark sky area inside national park. No artificial lights for miles around.',
        bortleScale: 1,
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'DarkSkyHunter',
        likes: 50,
        siqs: 9.5,
        photoUrl: 'https://images.unsplash.com/photo-1516331138075-f3adc1e149cd?q=80&w=1000',
        photographer: 'CosmicCaptures',
        isViable: true
      },
      {
        id: '6',
        name: 'Lake Shore Site',
        latitude: latitude - 0.5,
        longitude: longitude - 0.5,
        description: 'Peaceful lakeside viewing area with low light pollution and good southern horizon.',
        bortleScale: 3,
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'AstronomyAddict',
        likes: 22,
        siqs: 7.8,
        photoUrl: 'https://images.unsplash.com/photo-1542012514-dcf83de10c1b?q=80&w=1000',
        photographer: 'StellarScenes',
        isViable: true
      },
      {
        id: '7',
        name: 'Highland Observation Spot',
        latitude: latitude + 0.65,
        longitude: longitude + 0.4,
        description: 'High altitude location with excellent seeing conditions and minimal atmospheric disturbance.',
        bortleScale: 2,
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'GalacticViewer',
        likes: 33,
        siqs: 8.9,
        photoUrl: 'https://images.unsplash.com/photo-1543345780-0b14511518b1?q=80&w=1000',
        photographer: 'AstroVista',
        isViable: true
      },
      {
        id: '8',
        name: 'Countryside Observatory',
        latitude: latitude - 0.75,
        longitude: longitude + 0.6,
        description: 'Rural location with friendly local astronomy club and regular star parties.',
        bortleScale: 3,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'StarTracker',
        likes: 27,
        siqs: 7.2,
        photoUrl: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1000',
        photographer: 'NightTimeImager',
        isViable: true
      },
      {
        id: '9',
        name: 'Forest Clearing',
        latitude: latitude + 0.85,
        longitude: longitude - 0.7,
        description: 'Natural clearing in dense forest, protected from city lights and great for nightscape photography.',
        bortleScale: 2,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'NebulaNomad',
        likes: 31,
        siqs: 8.3,
        photoUrl: 'https://images.unsplash.com/photo-1456428199391-a3b1cb5e93ab?q=80&w=1000',
        photographer: 'DeepSkyDreamer',
        isViable: true
      },
      {
        id: '10',
        name: 'Mountain Peak',
        latitude: latitude - 0.9,
        longitude: longitude - 0.9,
        description: 'The highest accessible point in the region with 360-degree views and crystal clear skies.',
        bortleScale: 1,
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'SkyObserver',
        likes: 48,
        siqs: 9.7,
        photoUrl: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?q=80&w=1000',
        photographer: 'AstralExplorer',
        isViable: true
      }
    ];
    
    // Add distance calculation
    const spotsWithDistance = mockSpots.map(spot => ({
      ...spot,
      distance: calculateDistance(latitude, longitude, spot.latitude, spot.longitude)
    }));
    
    // Filter by radius and sort by distance
    return spotsWithDistance
      .filter(spot => spot.distance <= radius)
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
