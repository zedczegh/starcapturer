import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";
import { getCityBortleScale, isInChina, getChineseRegion } from "@/utils/chinaBortleData";
import { findClosestLocation } from "@/data/locationDatabase";

// Add more detailed data for rural northern provinces
const northernRuralAreas = [
  // Inner Mongolia rural areas
  { name: "Hulunbuir Grasslands", lat: 49.2122, lng: 119.7536, bortleScale: 2 },
  { name: "Xilingol Grasslands", lat: 43.9436, lng: 116.0741, bortleScale: 2.5 },
  { name: "Ordos Desert", lat: 39.6087, lng: 109.7720, bortleScale: 2.8 },
  { name: "Horqin Grasslands", lat: 44.5791, lng: 121.5161, bortleScale: 3 },
  
  // Heilongjiang rural areas
  { name: "Greater Khingan Mountains", lat: 51.6770, lng: 124.7108, bortleScale: 1.8 },
  { name: "Wudalianchi Volcanic Area", lat: 48.7208, lng: 126.1183, bortleScale: 2.2 },
  { name: "Zhalong Nature Reserve", lat: 47.1116, lng: 124.2541, bortleScale: 2.5 },
  { name: "Sanjiang Plain", lat: 47.5498, lng: 133.5102, bortleScale: 2.3 },
  
  // Jilin rural areas
  { name: "Changbai Mountains", lat: 42.1041, lng: 128.1955, bortleScale: 2 },
  { name: "Chagan Lake", lat: 45.2580, lng: 124.2766, bortleScale: 3 },
  { name: "Jingyuetan National Forest", lat: 43.8266, lng: 125.4037, bortleScale: 3.5 },
  
  // Liaoning rural areas
  { name: "Huanren Manchu County", lat: 41.2674, lng: 125.3610, bortleScale: 3 },
  { name: "Fenghuangshan Mountains", lat: 40.5777, lng: 123.7510, bortleScale: 3.2 },
  
  // Hebei rural areas
  { name: "Chengde Mountain Resort", lat: 40.9861, lng: 117.9340, bortleScale: 3.5 },
  { name: "Bashang Grasslands", lat: 41.7342, lng: 115.9922, bortleScale: 2.8 },
  { name: "Wuling Mountain", lat: 40.6067, lng: 117.4856, bortleScale: 3 },
  
  // Shanxi rural areas
  { name: "Wutai Mountains", lat: 39.0250, lng: 113.5833, bortleScale: 3.2 },
  { name: "Taihang Mountains", lat: 37.8842, lng: 113.0999, bortleScale: 3 },
  { name: "Mian Mountains", lat: 37.1308, lng: 112.0999, bortleScale: 2.8 },
  
  // Shaanxi rural areas
  { name: "Huashan Mountains", lat: 34.4939, lng: 110.0871, bortleScale: 3 },
  { name: "Qinling Mountains", lat: 33.9987, lng: 108.4800, bortleScale: 2.5 },
  
  // Gansu rural areas
  { name: "Dunhuang Desert", lat: 40.1421, lng: 94.6618, bortleScale: 1.5 },
  { name: "Qilian Mountains", lat: 38.1917, lng: 99.8201, bortleScale: 2 },
  { name: "Zhangye Danxia", lat: 38.8456, lng: 100.4514, bortleScale: 2.3 }
];

/**
 * Find the nearest northern rural area and its Bortle scale
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @returns The nearest rural area and its Bortle scale
 */
function findNearestRuralArea(latitude: number, longitude: number): { name: string; bortleScale: number; distance: number } | null {
  if (!latitude || !longitude) return null;
  
  let nearestArea = null;
  let minDistance = Infinity;
  
  for (const area of northernRuralAreas) {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (area.lat - latitude) * Math.PI / 180;
    const dLon = (area.lng - longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latitude * Math.PI / 180) * Math.cos(area.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestArea = { 
        name: area.name, 
        bortleScale: area.bortleScale,
        distance: distance 
      };
    }
  }
  
  return nearestArea && minDistance < 200 ? nearestArea : null;
}

/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 * With improved handling for all Chinese regions
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number | null } | null> {
  try {
    // Validate coordinates before proceeding
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.log("Invalid coordinates for light pollution data:", latitude, longitude);
      return { bortleScale: 4 }; // Return default value instead of null
    }
    
    // First check for specific Chinese cities using our comprehensive database
    const specificCityBortle = getCityBortleScale(latitude, longitude);
    if (specificCityBortle !== null) {
      console.log("Using specific city Bortle scale:", specificCityBortle);
      return { bortleScale: specificCityBortle };
    }
    
    // Check if we're in a northern rural area
    const ruralArea = findNearestRuralArea(latitude, longitude);
    if (ruralArea) {
      console.log(`Using rural area data: ${ruralArea.name}, Bortle: ${ruralArea.bortleScale}, Distance: ${ruralArea.distance.toFixed(2)}km`);
      return { bortleScale: ruralArea.bortleScale };
    }
    
    // Try to get data from our enhanced light pollution database
    try {
      const closestCity = findClosestCity(latitude, longitude);
      console.log("Using enhanced database for Bortle scale:", closestCity);
      
      // Check if we're in China to adjust distance thresholds
      const inChina = isInChina(latitude, longitude);
      let distanceThreshold = inChina ? 120 : 100;
      
      // Adjust thresholds for different regions in China
      if (inChina) {
        const region = getChineseRegion(latitude, longitude);
        
        if (region === 'Tibet' || region === 'Xinjiang' || region === 'Qinghai' || region === 'Gansu') {
          distanceThreshold = 150; // Extended influence for cities in remote western regions
        } else if (region === 'Inner Mongolia' || region === 'Heilongjiang' || region === 'Jilin') {
          distanceThreshold = 140; // Extended influence for northern regions
        }
        
        // If city is found in these regions
        if (closestCity.type === 'urban' && closestCity.distance < distanceThreshold) {
          // Apply distance correction - urban centers in remote areas cast light pollution further
          const adjustedBortle = Math.max(
            1,
            closestCity.bortleScale - (closestCity.distance / distanceThreshold) * 5
          );
          return { bortleScale: adjustedBortle };
        }
      }
      
      if (closestCity.distance < distanceThreshold) {
        return { bortleScale: closestCity.bortleScale };
      }
      
      // If no close city, use interpolation for better accuracy
      const interpolatedScale = interpolateBortleScale(latitude, longitude);
      console.log("Using interpolated Bortle scale:", interpolatedScale);
      return { bortleScale: interpolatedScale };
    } catch (error) {
      console.error("Error using enhanced light pollution database:", error);
      // Fall back to legacy database if enhanced database fails
    }
    
    // Fall back to our legacy location database
    const { findClosestLocation } = await import('../../data/locationDatabase');
    
    // Check primary database (high-accuracy data)
    const locationInfo = findClosestLocation(latitude, longitude);
    console.log("Primary database lookup for light pollution:", locationInfo);
    
    if (locationInfo && 
        typeof locationInfo.bortleScale === 'number' && 
        locationInfo.bortleScale >= 1 && 
        locationInfo.bortleScale <= 9) {
      console.log("Using primary database for Bortle scale:", locationInfo.bortleScale);
      return { bortleScale: locationInfo.bortleScale };
    }
    
    // Fallback to known locations utility
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    
    // Check known locations database (supplementary data)
    const knownLocation = findClosestKnownLocation(latitude, longitude);
    
    // If we have a reliable known location that's close enough
    if (knownLocation && 
        typeof knownLocation.bortleScale === 'number' && 
        knownLocation.bortleScale >= 1 && 
        knownLocation.bortleScale <= 9) {
      console.log("Using known location database for Bortle scale:", knownLocation.bortleScale);
      return { bortleScale: knownLocation.bortleScale };
    }
    
    // Last resort - try to estimate based on location name if we have one
    if (knownLocation && knownLocation.name) {
      const { estimateBortleScaleByLocation } = await import('../../utils/locationUtils');
      const estimatedScale = estimateBortleScaleByLocation(knownLocation.name, latitude, longitude);
      
      if (estimatedScale >= 1 && estimatedScale <= 9) {
        console.log("Using estimated Bortle scale:", estimatedScale);
        return { bortleScale: estimatedScale };
      }
    }
    
    // If everything fails, return a default value based on general geographic patterns
    const defaultScale = estimateDefaultBortleScale(latitude, longitude);
    console.log("Using default Bortle scale:", defaultScale);
    return { bortleScale: defaultScale };
    
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    return { bortleScale: 4 }; // Return default value instead of null
  }
}

/**
 * Provides a reasonable default Bortle scale estimate based on general geographic patterns
 * when we don't have specific location data
 * Updated to account for light pollution in Chinese cities
 */
function estimateDefaultBortleScale(latitude: number, longitude: number): number {
  // China is a special case due to its vast geography and varying levels of development
  if (isInChina(latitude, longitude)) {
    const region = getChineseRegion(latitude, longitude);
    
    // Different regions have different general Bortle scales
    switch (region) {
      case 'Tibet':
        return 3; // Tibet is generally dark except cities
      case 'Xinjiang':
        return 4; // Xinjiang is generally dark except cities
      case 'Qinghai':
        return 3.5; // Qinghai is generally dark except cities
      case 'Gansu':
        return 4.5; // Gansu has more development
      case 'Inner Mongolia':
        return 4; // Inner Mongolia is generally dark except cities
      case 'Heilongjiang':
      case 'Jilin':
      case 'Liaoning':
        return 5; // Northeast China has moderate development
      default:
        // Eastern China generally has high light pollution
        if (longitude > 105) {
          return 6.5;
        }
        // Central China has moderate light pollution
        else if (longitude > 95) {
          return 5.5;
        }
        // Western China is generally darker
        else {
          return 4;
        }
    }
  }
  
  // Major urban centers around the world
  if ((latitude > 35 && latitude < 45 && longitude > -125 && longitude < -65) || // North America
      (latitude > 45 && latitude < 60 && longitude > -10 && longitude < 30) ||   // Europe
      (latitude > 30 && latitude < 45 && longitude > 125 && longitude < 145)) {  // Japan/Korea
    return 6; // Moderate-high light pollution
  }
  
  // Remote areas
  if ((latitude > 60 || latitude < -50) ||                          // Far north/south
      (longitude > -170 && longitude < -140 && latitude < 30) ||    // Pacific
      (longitude > 85 && longitude < 110 && latitude > 30 && latitude < 50 && 
       !(latitude > 35 && latitude < 45 && longitude > 100 && longitude < 105))) { // Central Asia except cities
    return 3; // Low light pollution
  }
  
  // Default middle value
  return 4;
}

/**
 * Get light pollution (Bortle scale) data from our location database 
 * when API calls fail or for offline use
 */
export const getFallbackBortleScale = (latitude: number, longitude: number): number => {
  try {
    const nearestLocation = findClosestLocation(latitude, longitude);
    
    // If we found a location relatively nearby (within 30km), use its Bortle scale
    if (nearestLocation && nearestLocation.distance <= 30) {
      console.log(`Using location database Bortle scale for ${nearestLocation.name}: ${nearestLocation.bortleScale}`);
      return nearestLocation.bortleScale;
    } else {
      // Default values based on location type (needs to be refined)
      // Deep rural areas: 1-3
      // Rural areas: 4
      // Suburbs: 5-6
      // Cities: 7-9
      return 4;
    }
  } catch (error) {
    console.error("Error getting fallback Bortle scale:", error);
    return 4; // Default to rural skies
  }
};
