
/**
 * API functions for astro spots
 */
import { fetchWithTimeout } from './fetchUtils';

export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqs?: number;
  isViable?: boolean;
  distance?: number;
  timestamp: string;
  date?: string;
  certification?: string;
  description?: string;
  isDarkSkyReserve?: boolean;
  calculatedLocation?: boolean;
  qualityScore?: number;
}

/**
 * Get a single astro spot by ID
 */
export async function getAstroSpot(id: string): Promise<SharedAstroSpot | null> {
  try {
    const response = await fetchWithTimeout(`/api/astro-spots/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch astro spot: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching astro spot:", error);
    return null;
  }
}

/**
 * Get all astro spots
 */
export async function getAstroSpots(): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetchWithTimeout(`/api/astro-spots`);
    if (!response.ok) {
      throw new Error(`Failed to fetch astro spots: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching astro spots:", error);
    return [];
  }
}

/**
 * Get photography locations
 */
export async function getPhotographyLocations(): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetchWithTimeout(`/api/photo-points`);
    if (!response.ok) {
      throw new Error(`Failed to fetch photography locations: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching photography locations:", error);
    return [];
  }
}

/**
 * Get photo points
 */
export async function getPhotoPoints(): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetchWithTimeout(`/api/photo-points`);
    if (!response.ok) {
      throw new Error(`Failed to fetch photo points: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching photo points:", error);
    return [];
  }
}
