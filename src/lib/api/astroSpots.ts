
import { calculateDistance } from '../api';

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
  radius = 5000  // km - increased to support our distance slider
): Promise<SharedAstroSpot[]> {
  try {
    // Mock implementation until we have a real backend
    // This creates a more diverse set of mock data with various distances and SIQS scores
    const mockSpots: SharedAstroSpot[] = [
      {
        id: '1',
        name: 'Dark Sky Reserve',
        latitude: latitude + 0.9,
        longitude: longitude + 0.9,
        description: 'Excellent dark sky site with minimal light pollution. Great for deep sky objects.',
        bortleScale: 2,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'AstroEnthusiast',
        likes: 42,
        siqs: 8.7,
        isViable: true,
        photoUrl: '/images/astro1.jpg',
        photographer: 'Maria Chen'
      },
      {
        id: '2',
        name: 'Mountain Lookout',
        latitude: latitude - 1.5,
        longitude: longitude - 0.5,
        description: 'High elevation site with clear horizons. Perfect for planets and lunar observation.',
        bortleScale: 3,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'StarGazer',
        likes: 28,
        siqs: 7.9,
        isViable: true,
        photoUrl: '/images/astro2.jpg',
        photographer: 'Liu Wei'
      },
      {
        id: '3',
        name: 'Coastal Viewing Point',
        latitude: latitude + 2.2,
        longitude: longitude - 2.2,
        description: 'Open view of the western horizon over the water. Good for sunset and early evening viewing.',
        bortleScale: 4,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'MilkyWayHunter',
        likes: 15,
        siqs: 6.8,
        isViable: true
      },
      {
        id: '4',
        name: 'Desert Observatory',
        latitude: latitude + 6.1,
        longitude: longitude - 3.8,
        description: 'Remote desert location with extremely dark skies. No light pollution for hundreds of kilometers.',
        bortleScale: 1,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'DeepSkyObserver',
        likes: 89,
        siqs: 9.5,
        isViable: true,
        photoUrl: '/images/astro3.jpg',
        photographer: 'James Wong'
      },
      {
        id: '5',
        name: 'Alpine Peak',
        latitude: latitude - 4.2,
        longitude: longitude + 5.1,
        description: 'High altitude alpine location above the cloud line. Breathtaking views of the night sky.',
        bortleScale: 2,
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'SkyClimber',
        likes: 63,
        siqs: 8.2,
        isViable: true,
        photoUrl: '/images/astro4.jpg',
        photographer: 'Zhang Min'
      },
      {
        id: '6',
        name: 'Island Retreat',
        latitude: latitude + 10.5,
        longitude: longitude + 8.3,
        description: 'Remote island with pristine dark skies and tropical climate. Perfect for astrophotography all year round.',
        bortleScale: 2,
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'OceanStar',
        likes: 51,
        siqs: 8.9,
        isViable: true
      },
      {
        id: '7',
        name: 'National Park Clearing',
        latitude: latitude - 7.8,
        longitude: longitude - 6.2,
        description: 'Natural clearing in a protected national park. No artificial lights and minimal air pollution.',
        bortleScale: 3,
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'WildernessAstronomer',
        likes: 37,
        siqs: 7.6,
        isViable: true,
        photoUrl: '/images/astro5.jpg',
        photographer: 'Chen Xiao'
      },
      {
        id: '8',
        name: 'Highland Plateau',
        latitude: latitude + 15.3,
        longitude: longitude - 12.7,
        description: 'Vast highland plateau with unobstructed 360-degree views. Excellent for panoramic Milky Way shots.',
        bortleScale: 2,
        date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'PanoAstro',
        likes: 72,
        siqs: 8.4,
        isViable: true
      },
      {
        id: '9',
        name: 'Ancient Observatory Site',
        latitude: latitude - 20.5,
        longitude: longitude + 18.9,
        description: 'Historic stargazing location used by ancient astronomers. Still maintains excellent dark sky conditions.',
        bortleScale: 3,
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'TimeWatcher',
        likes: 94,
        siqs: 7.8,
        isViable: true,
        photoUrl: '/images/astro6.jpg',
        photographer: 'Li Hong'
      },
      {
        id: '10',
        name: 'Volcanic Crater',
        latitude: latitude + 25.8,
        longitude: longitude + 22.1,
        description: 'Dormant volcanic crater with high elevation and minimal atmospheric disturbance.',
        bortleScale: 2,
        date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'FireSky',
        likes: 83,
        siqs: 8.6,
        isViable: true,
        photoUrl: '/images/astro7.jpg',
        photographer: 'Wang Jie'
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
