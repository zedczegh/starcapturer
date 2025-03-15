
import { calculateDistance } from "@/data/utils/distanceCalculator";

const ASTROSPOTS_API_URL = import.meta.env.VITE_ASTROSPOTS_API_URL || "http://localhost:3001";

export interface AstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
}

export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  description?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqs?: number;
  distance?: number;
  isViable?: boolean;
}

export async function getAstroSpots(): Promise<AstroSpot[]> {
  try {
    const response = await fetch(`${ASTROSPOTS_API_URL}/astrospots`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as AstroSpot[];
  } catch (error) {
    console.error("Could not fetch astro spots:", error);
    return [];
  }
}

export async function getSharedAstroSpots(latitude: number, longitude: number, limit: number = 10, distance: number = 1000): Promise<SharedAstroSpot[]> {
  try {
    const response = await fetch(`${ASTROSPOTS_API_URL}/sharedAstrospots?latitude=${latitude}&longitude=${longitude}&limit=${limit}&distance=${distance}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as SharedAstroSpot[];
  } catch (error) {
    console.error("Could not fetch shared astro spots:", error);
    return [];
  }
}

export async function getRecommendedPhotoPoints(latitude: number, longitude: number): Promise<SharedAstroSpot[]> {
   try {
    const response = await fetch(`${ASTROSPOTS_API_URL}/sharedAstrospots/recommend?latitude=${latitude}&longitude=${longitude}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as SharedAstroSpot[];
  } catch (error) {
    console.error("Could not fetch shared astro spots:", error);
    return [];
  }
}

export async function shareAstroSpot(astroSpot: Omit<SharedAstroSpot, 'id'>): Promise<SharedAstroSpot | null> {
  try {
    const response = await fetch(`${ASTROSPOTS_API_URL}/sharedAstrospots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(astroSpot),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as SharedAstroSpot;
  } catch (error) {
    console.error("Could not share astro spot:", error);
    return null;
  }
}
