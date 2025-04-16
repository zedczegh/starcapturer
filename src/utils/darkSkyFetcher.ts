
import { LocationEntry } from '@/data/locationDatabase';

interface IDASkyPlace {
  name: string;
  type: string;
  country: string;
  coordinates: [number, number];
  certification?: string;
  chineseName?: string;
}

/**
 * Fetch dark sky places from IDA website
 * Note: This needs to be run server-side or in development
 */
export async function fetchDarkSkyPlaces(): Promise<IDASkyPlace[]> {
  try {
    const response = await fetch('https://darksky.org/wp-json/wp/v2/places');
    if (!response.ok) {
      throw new Error('Failed to fetch dark sky places');
    }
    
    const data = await response.json();
    return data.map((place: any) => ({
      name: place.title.rendered,
      type: determinePlaceType(place.acf.place_type),
      country: place.acf.country || '',
      coordinates: [
        parseFloat(place.acf.latitude),
        parseFloat(place.acf.longitude)
      ],
      certification: getCertificationType(place.acf.place_type)
    }));
  } catch (error) {
    console.error('Error fetching dark sky places:', error);
    return [];
  }
}

/**
 * Convert IDA place type to our location type
 */
function determinePlaceType(idaType: string): 'dark-site' | 'urban' | 'natural' {
  const type = idaType.toLowerCase();
  if (type.includes('sanctuary') || type.includes('reserve')) {
    return 'dark-site';
  } else if (type.includes('community') || type.includes('urban')) {
    return 'urban';
  }
  return 'natural';
}

/**
 * Get certification type based on IDA designation
 */
function getCertificationType(idaType: string): string {
  const typeMap: Record<string, string> = {
    'International Dark Sky Community': 'International Dark Sky Community',
    'International Dark Sky Park': 'International Dark Sky Park',
    'International Dark Sky Reserve': 'International Dark Sky Reserve',
    'International Dark Sky Sanctuary': 'International Dark Sky Sanctuary',
    'Urban Night Sky Place': 'Urban Night Sky Place'
  };
  
  return typeMap[idaType] || 'Dark Sky Location';
}

/**
 * Convert IDA places to our database format
 */
export function convertToLocationEntries(places: IDASkyPlace[]): LocationEntry[] {
  return places.map(place => ({
    name: place.name,
    coordinates: [place.coordinates[0], place.coordinates[1]],
    bortleScale: estimateBortleScale(place.type),
    radius: getLocationRadius(place.type),
    type: place.type,
    certification: place.certification,
    chineseName: translateLocationName(place.name)
  }));
}

/**
 * Estimate Bortle scale based on location type
 */
function estimateBortleScale(type: string): number {
  switch (type) {
    case 'dark-site':
      return 1.5; // Dark sky reserves and sanctuaries
    case 'natural':
      return 2.5; // Parks and protected areas
    case 'urban':
      return 4.5; // Communities and urban places
    default:
      return 3.0;
  }
}

/**
 * Get appropriate radius based on location type
 */
function getLocationRadius(type: string): number {
  switch (type) {
    case 'dark-site':
      return 50; // Large radius for reserves
    case 'natural':
      return 30; // Medium for parks
    case 'urban':
      return 15; // Smaller for communities
    default:
      return 25;
  }
}

/**
 * Basic translation of location names
 * Note: This should be enhanced with proper translations
 */
function translateLocationName(name: string): string {
  return `暗夜天空${name}`; // Prefix with "Dark Sky" in Chinese
}
