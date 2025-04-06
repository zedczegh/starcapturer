
import { fetchWithTimeout } from './fetchUtils';

/**
 * Interface for known locations with Bortle scale
 */
interface KnownLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
}

/**
 * Get the user's current location
 */
export async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Get location name from coordinates using reverse geocoding
 */
export async function getLocationName(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // Use reverse geocoding API
    const apiUrl = `/api/geocode?lat=${latitude}&lng=${longitude}&lang=${language}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, 5000);
    
    if (!response.ok) {
      throw new Error(`Failed to get location name: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got a valid response
    if (data && data.name) {
      return data.name;
    }
    
    throw new Error('No location name found');
  } catch (error) {
    console.error('Error getting location name:', error);
    
    // Fallback: Generate location name from coordinates
    return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  }
}

/**
 * Mock database of known locations with Bortle scale values
 */
const knownLocations: KnownLocation[] = [
  { name: 'Cherry Springs State Park', latitude: 41.6657, longitude: -77.8238, bortleScale: 2 },
  { name: 'Death Valley National Park', latitude: 36.5323, longitude: -116.9325, bortleScale: 1 },
  { name: 'Natural Bridges National Monument', latitude: 37.6212, longitude: -109.9758, bortleScale: 1 },
  { name: 'NamibRand Nature Reserve', latitude: -25.0280, longitude: 16.0729, bortleScale: 1 },
  { name: 'Aoraki Mackenzie', latitude: -43.7340, longitude: 170.0966, bortleScale: 2 },
  { name: 'Atacama Desert', latitude: -24.5000, longitude: -69.2500, bortleScale: 1 },
  { name: 'McDonald Observatory', latitude: 30.6715, longitude: -104.0227, bortleScale: 2 },
  { name: 'Flagstaff, AZ', latitude: 35.1983, longitude: -111.6513, bortleScale: 4 },
  { name: 'Big Bend National Park', latitude: 29.1275, longitude: -103.2429, bortleScale: 1 },
  { name: 'Galloway Forest Park', latitude: 55.1140, longitude: -4.6735, bortleScale: 3 },
  { name: 'Westhavelland Nature Park', latitude: 52.6967, longitude: 12.3033, bortleScale: 3 },
  { name: 'Mont-Mégantic', latitude: 45.4571, longitude: -71.1530, bortleScale: 3 },
  { name: 'Manhattan, NY', latitude: 40.7831, longitude: -73.9712, bortleScale: 9 },
  { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, bortleScale: 9 },
  { name: 'London, UK', latitude: 51.5074, longitude: -0.1278, bortleScale: 8 },
  { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522, bortleScale: 9 },
  { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, bortleScale: 9 },
  { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, bortleScale: 8 },
  { name: 'Shanghai, China', latitude: 31.2304, longitude: 121.4737, bortleScale: 9 },
  { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, bortleScale: 8 }
];

/**
 * Find the closest known location from our database
 */
export function findClosestKnownLocation(latitude: number, longitude: number): { name: string, bortleScale: number, distance: number } | null {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  let closestLocation: KnownLocation | null = null;
  let minDistance = Infinity;
  
  // Calculate distance to each known location
  knownLocations.forEach(location => {
    const distance = calculateDistance(
      latitude, longitude, 
      location.latitude, location.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  });
  
  // If we found a close match, return it
  if (closestLocation && minDistance < 100) { // Within 100 km
    return {
      name: closestLocation.name,
      bortleScale: closestLocation.bortleScale,
      distance: minDistance
    };
  }
  
  // If no close match, return null
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Classify location into urban, suburban, rural, remote based on Bortle scale
 */
export function getLocationClassification(bortleScale: number): string {
  if (bortleScale <= 2) return 'Remote';
  if (bortleScale <= 4) return 'Rural';
  if (bortleScale <= 6) return 'Suburban';
  return 'Urban';
}
