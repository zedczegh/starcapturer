import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";
import { getCityBortleScale, isInChina, getChineseRegion } from "@/utils/chinaBortleData";

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

const internationalDarkSkyAreas = [
  // North America
  { name: "Big Bend National Park", lat: 29.1275, lng: -103.2425, bortleScale: 1.2 },
  { name: "Death Valley National Park", lat: 36.5054, lng: -117.0794, bortleScale: 1.0 },
  { name: "Grand Canyon National Park", lat: 36.1069, lng: -112.1125, bortleScale: 1.8 },
  { name: "Cherry Springs State Park", lat: 41.6626, lng: -77.8236, bortleScale: 1.4 },
  
  // Europe
  { name: "Westhavelland Nature Park", lat: 52.6967, lng: 12.2767, bortleScale: 2.0 },
  { name: "Exmoor National Park", lat: 51.1156, lng: -3.6381, bortleScale: 2.2 },
  { name: "NamibRand Nature Reserve", lat: -25.0392, lng: 15.9709, bortleScale: 1.0 },
  { name: "Aoraki Mackenzie", lat: -44.0054, lng: 170.1418, bortleScale: 1.1 },
  
  // Australia
  { name: "Warrumbungle National Park", lat: -31.2733, lng: 149.0911, bortleScale: 1.3 },
  { name: "River Murray", lat: -34.1743, lng: 139.2917, bortleScale: 1.7 },
  
  // Asia
  { name: "Yeongyang Firefly Eco Park", lat: 36.6626, lng: 129.1122, bortleScale: 2.5 },
  { name: "Iriomote-Ishigaki National Park", lat: 24.3787, lng: 124.1580, bortleScale: 2.0 }
];

function isTemperateCoastalClimate(latitude: number, longitude: number, weatherData: any): boolean {
  const temp = weatherData?.main?.temp;
  const isModerateTemp = temp && temp > 283 && temp < 300; // 10°C to 27°C
  const isHumid = weatherData?.main?.humidity > 60;
  
  // Check if location is near a coast (simplified)
  const isCoastal = isNearCoast(latitude, longitude);
  
  return isModerateTemp && isHumid && isCoastal;
}

function isNearCoast(latitude: number, longitude: number): boolean {
  // Simplified coast detection logic
  return (longitude > 105 && longitude < 120) || (longitude < -105 && longitude > -120);
}

/**
 * Find the nearest special dark sky area and its Bortle scale
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @returns The nearest dark sky area and its Bortle scale
 */
function findNearestDarkSkyArea(latitude: number, longitude: number): { name: string; bortleScale: number; distance: number } | null {
  if (!latitude || !longitude) return null;
  
  // Combine all special areas
  const allSpecialAreas = [...northernRuralAreas, ...internationalDarkSkyAreas];
  
  let nearestArea = null;
  let minDistance = Infinity;
  
  for (const area of allSpecialAreas) {
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
  
  // Only return if area is within 150km (increased range for better coverage)
  return nearestArea && minDistance < 150 ? nearestArea : null;
}

/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 * With improved handling for all regions globally
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
    
    // Check if we're in a special dark sky area
    const specialArea = findNearestDarkSkyArea(latitude, longitude);
    if (specialArea) {
      console.log(`Using special area data: ${specialArea.name}, Bortle: ${specialArea.bortleScale}, Distance: ${specialArea.distance.toFixed(2)}km`);
      
      // Apply distance falloff for more realistic values
      if (specialArea.distance > 50) {
        // Gradual increase in Bortle scale with distance (darkest areas get more protection)
        const distanceFactor = (specialArea.distance - 50) / 100;
        const adjustedBortle = Math.min(
          specialArea.bortleScale + (distanceFactor * (9 - specialArea.bortleScale) * 0.7),
          6.5 // Cap at 6.5 - remote areas still benefit from dark skies
        );
        return { bortleScale: adjustedBortle };
      }
      
      return { bortleScale: specialArea.bortleScale };
    }
    
    // Try to get data from our enhanced light pollution database
    try {
      const closestCity = findClosestCity(latitude, longitude);
      console.log("Using enhanced database for Bortle scale:", closestCity);
      
      // Determine region-specific settings
      const inChina = isInChina(latitude, longitude);
      let distanceThreshold = inChina ? 120 : 100;
      
      // Adjust thresholds for different regions
      if (inChina) {
        const region = getChineseRegion(latitude, longitude);
        
        if (region === 'Tibet' || region === 'Xinjiang' || region === 'Qinghai' || region === 'Gansu') {
          distanceThreshold = 150; // Extended influence for cities in remote western regions
        } else if (region === 'Inner Mongolia' || region === 'Heilongjiang' || region === 'Jilin') {
          distanceThreshold = 140; // Extended influence for northern regions
        }
        
        // If city is found in these regions
        if (closestCity.type === 'urban' && closestCity.distance < distanceThreshold) {
          // Apply distance correction with improved formula for more realistic falloff
          const distancePercentage = closestCity.distance / distanceThreshold;
          const isUrban = closestCity.type === 'urban';
          const isSuburban = closestCity.type === 'suburban';
          
          // More realistic light pollution falloff based on inverse square law
          // Larger cities affect farther distances
          const falloffExponent = isUrban ? 1.5 : (isSuburban ? 1.7 : 2.0);
          const lightFalloff = Math.pow(distancePercentage, falloffExponent);
          
          // Base reduction varies by city type
          const baseReduction = isUrban ? 5 : (isSuburban ? 4 : 3);
          
          // Apply the adjusted formula
          const adjustedBortle = Math.max(
            1,
            closestCity.bortleScale - (lightFalloff * baseReduction)
          );
          
          return { bortleScale: adjustedBortle };
        }
      } else {
        // Apply improved global calculation
        if (closestCity.distance < distanceThreshold) {
          // Apply better international light pollution modeling
          const distancePercentage = closestCity.distance / distanceThreshold;
          const populationFactor = closestCity.type === 'urban' ? 1.0 : 
                                  closestCity.type === 'suburban' ? 0.8 : 0.6;
          
          // Apply inverse square law more accurately for light pollution falloff
          const adjustedBortle = Math.max(
            1,
            closestCity.bortleScale - (Math.pow(distancePercentage, 1.6) * 4 * populationFactor)
          );
          
          return { bortleScale: adjustedBortle };
        }
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
 * Updated with improved global population heuristics
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
  
  // Global population density heuristics for more accurate Bortle scale estimates
  
  // Major developed urban centers
  if ((latitude > 35 && latitude < 45 && longitude > -125 && longitude < -65) || // North America
      (latitude > 45 && latitude < 60 && longitude > -10 && longitude < 30) ||   // Europe
      (latitude > 30 && latitude < 45 && longitude > 125 && longitude < 145)) {  // Japan/Korea
    return 6; // Moderate-high light pollution
  }
  
  // Less densely populated developed areas
  if ((latitude > 25 && latitude < 35 && longitude > -125 && longitude < -65) || // Southern US
      (latitude > 35 && latitude < 45 && longitude > 30 && longitude < 60)) {    // Central Asia
    return 5; // Moderate light pollution
  }
  
  // Dense developing regions
  if ((latitude > 5 && latitude < 30 && longitude > 70 && longitude < 90) ||    // India
      (latitude > -25 && latitude < 0 && longitude > -60 && longitude < -30)) { // Brazil
    return 5.5; // Moderate-high with uneven development
  }
  
  // Sparsely populated regions
  if ((latitude > -35 && latitude < -15 && longitude > 115 && longitude < 145) || // Australia
      (latitude > 50 && latitude < 70 && longitude > -130 && longitude < -60)) {  // Canada/Alaska
    return 3.5; // Low-moderate light pollution
  }
  
  // Remote areas
  if ((latitude > 60 || latitude < -50) ||                          // Far north/south
      (longitude > -170 && longitude < -140 && latitude < 30) ||    // Pacific
      (longitude > 85 && longitude < 110 && latitude > 30 && latitude < 50 && 
       !(latitude > 35 && latitude < 45 && longitude > 100 && longitude < 105))) { // Central Asia except cities
    return 3; // Low light pollution
  }
  
  // Desert/wilderness regions
  if ((latitude > 15 && latitude < 35 && longitude > -20 && longitude < 40) ||   // Sahara
      (latitude > -35 && latitude < -20 && longitude > 10 && longitude < 30)) {  // Namibia/Botswana
    return 2; // Very low light pollution
  }
  
  // Default middle value for other areas
  return 4.5;
}
