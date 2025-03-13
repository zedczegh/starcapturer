
/**
 * Utility functions for estimating Bortle scale when light pollution API is unavailable
 */

import { Location } from "@/components/MapSelector";

// Function to estimate Bortle scale based on location data
export const estimateBortleScaleByLocation = (
  locationName: string,
  latitude: number = 0,
  longitude: number = 0
): number => {
  // Convert to lowercase for case-insensitive matching
  const lowercaseName = locationName.toLowerCase();
  
  // Major urban centers - very high light pollution (Class 8-9)
  if (
    /\b(beijing|shanghai|tokyo|new york|nyc|los angeles|london|paris|chicago|seoul|mumbai|delhi|mexico city|cairo|singapore|hong kong)\b/.test(lowercaseName) ||
    lowercaseName.includes('downtown') ||
    lowercaseName.includes('city center')
  ) {
    return 8; // Class 8: Urban center
  }
  
  // Urban areas (Class 7)
  if (
    lowercaseName.includes('city') || 
    lowercaseName.includes('urban') ||
    lowercaseName.includes('metro') ||
    lowercaseName.includes('municipal')
  ) {
    return 7; // Class 7: Urban area
  }
  
  // Suburban areas (Class 6)
  if (
    lowercaseName.includes('suburb') || 
    lowercaseName.includes('residential') || 
    lowercaseName.includes('borough') ||
    lowercaseName.includes('district')
  ) {
    return 6; // Class 6: Suburban
  }
  
  // Small towns and villages (Class 4-5)
  if (
    lowercaseName.includes('town') ||
    lowercaseName.includes('township') ||
    lowercaseName.includes('village')
  ) {
    return 5; // Class 5: Small town
  }
  
  // Rural areas (Class 3-4)
  if (
    lowercaseName.includes('rural') || 
    lowercaseName.includes('countryside') ||
    lowercaseName.includes('farmland') ||
    lowercaseName.includes('agricultural')
  ) {
    return 4; // Class 4: Rural area
  }
  
  // Natural areas and parks (Class 3)
  if (
    lowercaseName.includes('park') || 
    lowercaseName.includes('forest') || 
    lowercaseName.includes('national') ||
    lowercaseName.includes('reserve') ||
    lowercaseName.includes('preserve')
  ) {
    return 3; // Class 3: Natural area
  }
  
  // Remote areas (Class 2)
  if (
    lowercaseName.includes('desert') ||
    lowercaseName.includes('mountain') ||
    lowercaseName.includes('remote') ||
    lowercaseName.includes('wilderness') ||
    lowercaseName.includes('isolated')
  ) {
    return 2; // Class 2: Remote area
  }
  
  // Known astronomical observation sites (Class 1-2)
  if (
    lowercaseName.includes('observatory') || 
    lowercaseName.includes('mauna kea') ||
    lowercaseName.includes('atacama') ||
    lowercaseName.includes('la palma') || 
    lowercaseName.includes('dark sky')
  ) {
    return 1; // Class 1: Excellent dark sky site
  }
  
  // Tibet, high altitude locations tend to have less light pollution
  if (
    lowercaseName.includes('tibet') ||
    lowercaseName.includes('himalaya') ||
    lowercaseName.includes('everest') ||
    (latitude > 28 && latitude < 40 && longitude > 80 && longitude < 95)
  ) {
    return 2; // Class 2: Very low light pollution
  }
  
  // Default - moderate light pollution assumption
  // If we have coordinates but no name information, make a rougher estimate
  if (!locationName && latitude !== 0 && longitude !== 0) {
    // Very high latitudes tend to be more remote with less light pollution
    if (Math.abs(latitude) > 60) {
      return 3; // Class 3: Northern regions often darker
    }
  }
  
  return 5; // Class 5 as default (conservative estimate)
};

// Get Bortle scale description based on the value
export const getBortleScaleDescription = (bortleScale: number): string => {
  switch (Math.floor(bortleScale)) {
    case 1:
      return "Excellent dark sky, Milky Way casts shadows";
    case 2:
      return "Truly dark sky, Milky Way highly structured";
    case 3:
      return "Rural sky, some light pollution but good detail";
    case 4:
      return "Rural/suburban transition, moderate light pollution";
    case 5:
      return "Suburban sky, Milky Way washed out overhead";
    case 6:
      return "Bright suburban sky, Milky Way only at zenith";
    case 7:
      return "Suburban/urban transition, no Milky Way visible";
    case 8:
      return "City sky, can see only Moon, planets, brightest stars";
    case 9:
      return "Inner city sky, only very brightest celestial objects visible";
    default:
      return "Unknown light pollution level";
  }
};

// Helper function to get Bortle scale color for visualization
export const getBortleScaleColor = (bortleScale: number): string => {
  switch (Math.floor(bortleScale)) {
    case 1: return "#000033"; // Near black/dark blue
    case 2: return "#000066"; // Very dark blue
    case 3: return "#0000cc"; // Dark blue
    case 4: return "#0099ff"; // Medium blue
    case 5: return "#33cc33"; // Green
    case 6: return "#ffff00"; // Yellow
    case 7: return "#ff9900"; // Orange
    case 8: return "#ff0000"; // Red
    case 9: return "#ff00ff"; // Magenta
    default: return "#ffffff"; // White (error/unknown)
  }
};
