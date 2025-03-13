/**
 * Utility functions for estimating Bortle scale when light pollution API is unavailable
 */

import { Location } from "@/components/MapSelector";

// Local database of major cities and locations with accurate Bortle scale values
// Data sourced from astronomical observations and light pollution maps
export const locationDatabase = [
  // Major urban centers with high light pollution
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8.7, radius: 30 },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.7, radius: 50 },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.8, radius: 50 },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 8.9, radius: 55 },
  { name: "New York", coordinates: [40.7128, -74.0060], bortleScale: 8.5, radius: 50 },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8.4, radius: 45 },
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8.3, radius: 40 },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 8.2, radius: 40 },
  { name: "Chicago", coordinates: [41.8781, -87.6298], bortleScale: 8.2, radius: 40 },
  { name: "Seoul", coordinates: [37.5665, 126.9780], bortleScale: 8.6, radius: 45 },
  { name: "Mumbai", coordinates: [19.0760, 72.8777], bortleScale: 8.4, radius: 45 },
  { name: "Delhi", coordinates: [28.6139, 77.2090], bortleScale: 8.6, radius: 45 },
  { name: "Mexico City", coordinates: [19.4326, -99.1332], bortleScale: 8.6, radius: 45 },
  { name: "Cairo", coordinates: [30.0444, 31.2357], bortleScale: 8.3, radius: 40 },
  { name: "Singapore", coordinates: [1.3521, 103.8198], bortleScale: 8.5, radius: 30 },
  
  // Smaller cities with moderate light pollution
  { name: "Seattle", coordinates: [47.6062, -122.3321], bortleScale: 7.5, radius: 25 },
  { name: "Austin", coordinates: [30.2672, -97.7431], bortleScale: 7.0, radius: 20 },
  { name: "Toronto", coordinates: [43.6532, -79.3832], bortleScale: 7.3, radius: 30 },
  { name: "Montreal", coordinates: [45.5017, -73.5673], bortleScale: 7.2, radius: 30 },
  { name: "Berlin", coordinates: [52.5200, 13.4050], bortleScale: 7.1, radius: 25 },
  { name: "Stockholm", coordinates: [59.3293, 18.0686], bortleScale: 6.8, radius: 20 },
  { name: "Athens", coordinates: [37.9838, 23.7275], bortleScale: 7.0, radius: 25 },
  { name: "Osaka", coordinates: [34.6937, 135.5023], bortleScale: 7.5, radius: 30 },
  { name: "Colombo", coordinates: [6.9271, 79.8612], bortleScale: 6.9, radius: 20 },
  { name: "Taipei", coordinates: [25.0330, 121.5654], bortleScale: 7.4, radius: 25 },
  { name: "Kuala Lumpur", coordinates: [3.1390, 101.6869], bortleScale: 7.3, radius: 30 },
  { name: "Manila", coordinates: [14.5995, 120.9842], bortleScale: 7.6, radius: 30 },
  { name: "Bangkok", coordinates: [13.7563, 100.2864], bortleScale: 7.5, radius: 30 },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.8, radius: 50 },
  
  // Dark sky locations with low light pollution
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1.0, radius: 50 },
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1.0, radius: 60 },
  { name: "La Palma", coordinates: [28.7136, -17.8834], bortleScale: 1.2, radius: 30 },
  { name: "Great Basin", coordinates: [38.9332, -114.2687], bortleScale: 1.0, radius: 50 },
  { name: "Big Bend", coordinates: [29.2498, -103.2502], bortleScale: 1.2, radius: 45 },
  { name: "Rocky Mountain", coordinates: [40.3428, -105.6836], bortleScale: 2.5, radius: 30 },
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 2.0, radius: 40 },
  { name: "Grand Canyon", coordinates: [36.1069, -112.1129], bortleScale: 2.2, radius: 30 },
  { name: "Yosemite", coordinates: [37.7331, -119.5874], bortleScale: 2.8, radius: 25 },
  { name: "Banff", coordinates: [51.1788, -115.5708], bortleScale: 2.0, radius: 30 },
  { name: "New Zealand Alps", coordinates: [-43.5321, 170.3865], bortleScale: 1.5, radius: 40 },
  { name: "Uluru", coordinates: [-25.3444, 131.0369], bortleScale: 1.0, radius: 60 },
  { name: "Everest Region", coordinates: [27.9881, 86.9250], bortleScale: 1.8, radius: 50 },
  { name: "Australian Outback", coordinates: [-20.7359, 139.4962], bortleScale: 1.0, radius: 100 },
  { name: "Baja California", coordinates: [23.4241, -110.2864], bortleScale: 2.0, radius: 40 },
  { name: "Antarctica", coordinates: [77.8750, -166.0528], bortleScale: 1.0, radius: 200 },
  { name: "Tibet", coordinates: [29.6500, 91.1000], bortleScale: 2.0, radius: 60 },

  // Natural areas with low-moderate light pollution
  { name: "Zhangjiajie", coordinates: [29.1174, 110.4794], bortleScale: 4.2, radius: 20 },
  { name: "Great Barrier Reef", coordinates: [-18.2871, 147.6992], bortleScale: 3.0, radius: 40 },
  { name: "Amazon Rainforest", coordinates: [-3.4653, -62.2159], bortleScale: 2.5, radius: 80 },
  { name: "Serengeti", coordinates: [-2.3333, 34.8333], bortleScale: 2.0, radius: 50 },
  { name: "Sahara Desert", coordinates: [23.4162, 25.6628], bortleScale: 1.5, radius: 100 },
  { name: "Gobi Desert", coordinates: [44.2567, 105.9537], bortleScale: 1.8, radius: 70 }
];

// Function to find the closest known location from our database
export const findClosestKnownLocation = (latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
} => {
  let closestLocation = {
    name: "",
    bortleScale: 5, // Default moderate value
    distance: Number.MAX_VALUE
  };

  // Validate coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      bortleScale: 5,
      distance: 0
    };
  }

  // Look for exact matches first (within a small radius)
  const exactMatchRadius = 0.05; // About 5km
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // If extremely close to a known location, use its name and data
    if (distance < exactMatchRadius) {
      return {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance
      };
    }
    
    // Track the closest location overall
    if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance
      };
    }
  }

  // If we found a location within a reasonable distance (50km), use it
  // Otherwise, return a generic location name with coordinates
  if (closestLocation.distance <= 50) {
    return closestLocation;
  } else {
    return {
      name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      bortleScale: estimateBortleScaleByContext(latitude, longitude),
      distance: 0
    };
  }
};

// Calculate distance between two points in km using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

// Convert degrees to radians
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Legacy function - updated to use our new database approach
export const estimateBortleScaleByLocation = (
  locationName: string,
  latitude: number = 0,
  longitude: number = 0
): number => {
  // Try to find the location in our database first
  const lowercaseName = locationName.toLowerCase();

  // Check if the location name matches any entry in our database
  for (const location of locationDatabase) {
    if (location.name.toLowerCase() === lowercaseName) {
      return location.bortleScale;
    }
  }

  // If not found by name but we have coordinates, find the closest location
  if (latitude !== 0 && longitude !== 0) {
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    if (closestLocation.distance <= 50) {
      return closestLocation.bortleScale;
    }
  }

  // If still not found, use the keyword-based approach as a fallback
  return estimateBortleScaleByNameKeywords(locationName);
};

// Estimate Bortle scale based on location name keywords (fallback method)
const estimateBortleScaleByNameKeywords = (locationName: string): number => {
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
  
  // Default - moderate light pollution assumption
  return 5; // Class 5 as default (conservative estimate)
};

// Estimate Bortle scale based on geographical context when we only have coordinates
function estimateBortleScaleByContext(latitude: number, longitude: number): number {
  // High latitudes tend to be darker
  if (Math.abs(latitude) > 60) {
    return 3; // Higher latitudes often have less light pollution
  }
  
  // Very remote longitudes (far from population centers)
  if (longitude > 100 || longitude < -120) {
    return 4; // Many remote areas in these regions
  }
  
  // Default moderate value
  return 5;
}

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
