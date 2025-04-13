
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Function to chunk array for better rendering performance
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Generate a unique ID for a location
export function generateLocationId(location: SharedAstroSpot): string {
  return location.id || `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
}

// Check if a location is certified (dark sky reserve or has certification)
export function isCertifiedLocation(location: SharedAstroSpot): boolean {
  return location.isDarkSkyReserve === true || (location.certification && location.certification !== '');
}
