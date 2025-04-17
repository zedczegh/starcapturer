import { fetchAirQualityData } from '.';
import { calculateDistance } from './coordinates';
import { isValidAstronomyLocation, isWaterLocation } from '@/utils/locationValidator';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  chineseName?: string;
  description?: string;
  shortDescription?: string;
  siqs?: number;
  bortleScale?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  distance?: number;
  timestamp?: string;
  weatherData?: any;
  seeingConditions?: number;
  averageVisibility?: number;
  lightPollutionData?: any;
  photos?: string[];
  tags?: string[];
  tips?: string[];
  address?: string;
  city?: string;
  country?: string;
  admin1?: string;
  isCoastal?: boolean;
  isMountainTop?: boolean;
  nearestCity?: string;
  population?: number;
  elevation?: number;
  aqi?: number;
  dominantPollutant?: string;
  siqsResult?: any;
}

/**
 * Fetch recommended photo points near a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param radius Search radius in kilometers
 * @param certifiedOnly Only return certified locations
 * @param limit Maximum number of results to return
 * @returns Array of SharedAstroSpot objects
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  radius: number = 50,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> {
  try {
    const url = `${API_BASE_URL}/api/photo-points/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}&certifiedOnly=${certifiedOnly}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    // Enhanced validation and transformation
    const validatedPoints: SharedAstroSpot[] = data.map(point => {
      const validatedPoint: SharedAstroSpot = {
        id: String(point.id || Math.random()),
        name: String(point.name || 'Unnamed Location'),
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
        chineseName: point.chineseName ? String(point.chineseName) : undefined,
        description: point.description ? String(point.description) : undefined,
        shortDescription: point.shortDescription ? String(point.shortDescription) : undefined,
        siqs: point.siqs !== undefined ? Number(point.siqs) : undefined,
        bortleScale: point.bortleScale !== undefined ? Number(point.bortleScale) : undefined,
        isDarkSkyReserve: !!point.isDarkSkyReserve,
        certification: point.certification ? String(point.certification) : undefined,
        distance: point.distance !== undefined ? Number(point.distance) : undefined,
        timestamp: point.timestamp ? String(point.timestamp) : new Date().toISOString(),
        weatherData: point.weatherData || undefined,
        seeingConditions: point.seeingConditions !== undefined ? Number(point.seeingConditions) : undefined,
        averageVisibility: point.averageVisibility !== undefined ? Number(point.averageVisibility) : undefined,
        lightPollutionData: point.lightPollutionData || undefined,
        photos: Array.isArray(point.photos) ? point.photos.map(String) : [],
        tags: Array.isArray(point.tags) ? point.tags.map(String) : [],
        tips: Array.isArray(point.tips) ? point.tips.map(String) : [],
        address: point.address ? String(point.address) : undefined,
        city: point.city ? String(point.city) : undefined,
        country: point.country ? String(point.country) : undefined,
        admin1: point.admin1 ? String(point.admin1) : undefined,
        isCoastal: !!point.isCoastal,
        isMountainTop: !!point.isMountainTop,
        nearestCity: point.nearestCity ? String(point.nearestCity) : undefined,
        population: point.population !== undefined ? Number(point.population) : undefined,
        elevation: point.elevation !== undefined ? Number(point.elevation) : undefined,
        aqi: point.aqi !== undefined ? Number(point.aqi) : undefined,
        dominantPollutant: point.dominantPollutant ? String(point.dominantPollutant) : undefined,
        siqsResult: point.siqsResult || undefined
      };
      
      return validatedPoint;
    });
    
    return validatedPoints;
  } catch (error) {
    console.error('Error fetching recommended photo points:', error);
    return [];
  }
}

/**
 * Generate a set of random points within a specified radius
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Search radius in kilometers
 * @param numPoints Number of points to generate
 * @returns Array of SharedAstroSpot objects
 */
export async function generateRandomPhotoPoints(
  centerLat: number,
  centerLng: number,
  radius: number = 50,
  numPoints: number = 10
): Promise<SharedAstroSpot[]> {
  const points: SharedAstroSpot[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    // Generate random coordinates within the radius
    const randomLat = centerLat + (Math.random() - 0.5) * (2 * radius / 111);
    const randomLng = centerLng + (Math.random() - 0.5) * (2 * radius / (111 * Math.cos(centerLat * Math.PI / 180)));
    
    // Ensure coordinates are within valid range
    const latitude = Math.max(-90, Math.min(90, randomLat));
    const longitude = Math.max(-180, Math.min(180, randomLng));
    
    // Check if the generated point is a water location
    if (isWaterLocation(latitude, longitude)) {
      console.log(`Generated water location, skipping: ${latitude}, ${longitude}`);
      continue; // Skip this point and generate another one
    }
    
    // Calculate distance from center
    const distance = calculateDistance(centerLat, centerLng, latitude, longitude);
    
    // Fetch air quality data
    const airQuality = await fetchAirQualityData(latitude, longitude);
    
    // Create a SharedAstroSpot object
    const point: SharedAstroSpot = {
      id: `random-${latitude}-${longitude}-${i}`,
      name: `Random Spot ${i + 1}`,
      latitude: latitude,
      longitude: longitude,
      description: `A randomly generated spot within ${radius} km of the center.`,
      siqs: Math.random() * 10, // Random SIQS score for testing
      distance: distance,
      timestamp: new Date().toISOString(),
      aqi: airQuality?.aqi,
      dominantPollutant: airQuality?.dominantPollutant
    };
    
    points.push(point);
  }
  
  return points;
}

/**
 * Upload a new photo point
 * @param photoPoint Photo point data
 * @returns The uploaded SharedAstroSpot object
 */
export async function uploadPhotoPoint(photoPoint: SharedAstroSpot): Promise<SharedAstroSpot | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(photoPoint),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data) {
      console.error('No data received after upload.');
      return null;
    }
    
    return data as SharedAstroSpot;
  } catch (error) {
    console.error('Error uploading photo point:', error);
    return null;
  }
}

/**
 * Get a single photo point by ID
 * @param id Photo point ID
 * @returns The SharedAstroSpot object or null if not found
 */
export async function getPhotoPointById(id: string): Promise<SharedAstroSpot | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data) {
      console.error('No data received for ID:', id);
      return null;
    }
    
    return data as SharedAstroSpot;
  } catch (error) {
    console.error(`Error fetching photo point with ID ${id}:`, error);
    return null;
  }
}

/**
 * Update an existing photo point
 * @param id Photo point ID
 * @param updates Updates to apply
 * @returns The updated SharedAstroSpot object or null if update failed
 */
export async function updatePhotoPoint(id: string, updates: Partial<SharedAstroSpot>): Promise<SharedAstroSpot | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data) {
      console.error('No data received after update.');
      return null;
    }
    
    return data as SharedAstroSpot;
  } catch (error) {
    console.error(`Error updating photo point with ID ${id}:`, error);
    return null;
  }
}

/**
 * Delete a photo point by ID
 * @param id Photo point ID
 * @returns True if deletion was successful, false otherwise
 */
export async function deletePhotoPoint(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response.status === 204;
  } catch (error) {
    console.error(`Error deleting photo point with ID ${id}:`, error);
    return false;
  }
}

/**
 * Fetch all photo points
 * @returns Array of SharedAstroSpot objects
 */
export async function getAllPhotoPoints(): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    return data as SharedAstroSpot[];
  } catch (error) {
    console.error('Error fetching all photo points:', error);
    return [];
  }
}

/**
 * Fetch a limited number of photo points with offset for pagination
 * @param limit Number of results to return
 * @param offset Offset for pagination
 * @returns Array of SharedAstroSpot objects
 */
export async function getPhotoPointsPaginated(limit: number = 10, offset: number = 0): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points?limit=${limit}&offset=${offset}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    return data as SharedAstroSpot[];
  } catch (error) {
    console.error('Error fetching paginated photo points:', error);
    return [];
  }
}

/**
 * Find photo points by search query
 * @param query Search query
 * @returns Array of SharedAstroSpot objects
 */
export async function searchPhotoPoints(query: string): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photo-points/search?query=${query}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    return data as SharedAstroSpot[];
  } catch (error) {
    console.error('Error searching photo points:', error);
    return [];
  }
}

/**
 * Find certified dark sky locations within radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Array of SharedAstroSpot
 */
export async function findCertifiedDarkSkyLocations(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  try {
    const url = `${API_BASE_URL}/api/dark-sky-locations/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    // Enhanced validation and transformation
    const validatedPoints: SharedAstroSpot[] = data.map(point => {
      const validatedPoint: SharedAstroSpot = {
        id: String(point.id || Math.random()),
        name: String(point.name || 'Unnamed Location'),
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
        chineseName: point.chineseName ? String(point.chineseName) : undefined,
        description: point.description ? String(point.description) : undefined,
        shortDescription: point.shortDescription ? String(point.shortDescription) : undefined,
        siqs: point.siqs !== undefined ? Number(point.siqs) : undefined,
        bortleScale: point.bortleScale !== undefined ? Number(point.bortleScale) : undefined,
        isDarkSkyReserve: !!point.isDarkSkyReserve,
        certification: point.certification ? String(point.certification) : undefined,
        distance: point.distance !== undefined ? Number(point.distance) : undefined,
        timestamp: point.timestamp ? String(point.timestamp) : new Date().toISOString(),
        weatherData: point.weatherData || undefined,
        seeingConditions: point.seeingConditions !== undefined ? Number(point.seeingConditions) : undefined,
        averageVisibility: point.averageVisibility !== undefined ? Number(point.averageVisibility) : undefined,
        lightPollutionData: point.lightPollutionData || undefined,
        photos: Array.isArray(point.photos) ? point.photos.map(String) : [],
        tags: Array.isArray(point.tags) ? point.tags.map(String) : [],
        tips: Array.isArray(point.tips) ? point.tips.map(String) : [],
        address: point.address ? String(point.address) : undefined,
        city: point.city ? String(point.city) : undefined,
        country: point.country ? String(point.country) : undefined,
        admin1: point.admin1 ? String(point.admin1) : undefined,
        isCoastal: !!point.isCoastal,
        isMountainTop: !!point.isMountainTop,
        nearestCity: point.nearestCity ? String(point.nearestCity) : undefined,
        population: point.population !== undefined ? Number(point.population) : undefined,
        elevation: point.elevation !== undefined ? Number(point.elevation) : undefined,
        aqi: point.aqi !== undefined ? Number(point.aqi) : undefined,
        dominantPollutant: point.dominantPollutant ? String(point.dominantPollutant) : undefined,
        siqsResult: point.siqsResult || undefined
      };
      
      return validatedPoint;
    });
    
    return validatedPoints;
  } catch (error) {
    console.error('Error fetching certified dark sky locations:', error);
    return [];
  }
}
