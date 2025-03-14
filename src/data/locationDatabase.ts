/**
 * Database of locations with accurate Bortle scale values
 * Data sourced from astronomical observations and light pollution maps
 */

export interface LocationEntry {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number; // km - the approximate radius this location's Bortle scale applies to
  type?: 'urban' | 'rural' | 'dark-site' | 'natural';
}

export const locationDatabase: LocationEntry[] = [
  // Major urban centers with high light pollution
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8.7, radius: 30, type: 'urban' },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.7, radius: 50, type: 'urban' },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.8, radius: 50, type: 'urban' },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 8.9, radius: 55, type: 'urban' },
  { name: "New York", coordinates: [40.7128, -74.0060], bortleScale: 8.5, radius: 50, type: 'urban' },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Chicago", coordinates: [41.8781, -87.6298], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Seoul", coordinates: [37.5665, 126.9780], bortleScale: 8.6, radius: 45, type: 'urban' },
  { name: "Mumbai", coordinates: [19.0760, 72.8777], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "Delhi", coordinates: [28.6139, 77.2090], bortleScale: 8.6, radius: 45, type: 'urban' },
  { name: "Mexico City", coordinates: [19.4326, -99.1332], bortleScale: 8.6, radius: 45, type: 'urban' },
  { name: "Cairo", coordinates: [30.0444, 31.2357], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Singapore", coordinates: [1.3521, 103.8198], bortleScale: 8.5, radius: 30, type: 'urban' },
  
  // Smaller cities with moderate light pollution
  { name: "Seattle", coordinates: [47.6062, -122.3321], bortleScale: 7.5, radius: 25, type: 'urban' },
  { name: "Austin", coordinates: [30.2672, -97.7431], bortleScale: 7.0, radius: 20, type: 'urban' },
  { name: "Toronto", coordinates: [43.6532, -79.3832], bortleScale: 7.3, radius: 30, type: 'urban' },
  { name: "Montreal", coordinates: [45.5017, -73.5673], bortleScale: 7.2, radius: 30, type: 'urban' },
  { name: "Berlin", coordinates: [52.5200, 13.4050], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Stockholm", coordinates: [59.3293, 18.0686], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Athens", coordinates: [37.9838, 23.7275], bortleScale: 7.0, radius: 25, type: 'urban' },
  { name: "Osaka", coordinates: [34.6937, 135.5023], bortleScale: 7.5, radius: 30, type: 'urban' },
  { name: "Colombo", coordinates: [6.9271, 79.8612], bortleScale: 6.9, radius: 20, type: 'urban' },
  { name: "Taipei", coordinates: [25.0330, 121.5654], bortleScale: 7.4, radius: 25, type: 'urban' },
  { name: "Kuala Lumpur", coordinates: [3.1390, 101.6869], bortleScale: 7.3, radius: 30, type: 'urban' },
  { name: "Manila", coordinates: [14.5995, 120.9842], bortleScale: 7.6, radius: 30, type: 'urban' },
  { name: "Bangkok", coordinates: [13.7563, 100.2864], bortleScale: 7.5, radius: 30, type: 'urban' },
  
  // Chinese cities and towns (with improved coverage for smaller locations)
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 8.1, radius: 35, type: 'urban' },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7.8, radius: 35, type: 'urban' },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7.9, radius: 35, type: 'urban' },
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 7.5, radius: 30, type: 'urban' },
  { name: "Tianjin", coordinates: [39.3434, 117.3616], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Chongqing", coordinates: [29.4316, 106.9123], bortleScale: 7.8, radius: 35, type: 'urban' },
  { name: "Hangzhou", coordinates: [30.2741, 120.1551], bortleScale: 7.7, radius: 35, type: 'urban' },
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7.6, radius: 30, type: 'urban' },
  { name: "Shenyang", coordinates: [41.8057, 123.4315], bortleScale: 7.5, radius: 30, type: 'urban' },
  { name: "Harbin", coordinates: [45.8038, 126.5340], bortleScale: 7.2, radius: 30, type: 'urban' },
  { name: "Changchun", coordinates: [43.8171, 125.3235], bortleScale: 7.0, radius: 25, type: 'urban' },
  { name: "Dalian", coordinates: [38.9140, 121.6147], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Qingdao", coordinates: [36.0671, 120.3826], bortleScale: 7.3, radius: 25, type: 'urban' },
  { name: "Ningbo", coordinates: [29.8683, 121.5440], bortleScale: 7.2, radius: 25, type: 'urban' },
  { name: "Xiamen", coordinates: [24.4798, 118.0819], bortleScale: 7.0, radius: 20, type: 'urban' },
  { name: "Zhengzhou", coordinates: [34.7466, 113.6253], bortleScale: 7.5, radius: 25, type: 'urban' },
  { name: "Changsha", coordinates: [28.2282, 112.9388], bortleScale: 7.4, radius: 25, type: 'urban' },
  { name: "Kunming", coordinates: [25.0389, 102.7183], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Nanning", coordinates: [22.8170, 108.3665], bortleScale: 6.7, radius: 20, type: 'urban' },
  
  // Smaller Chinese towns
  { name: "Duyun", coordinates: [26.2592, 107.5113], bortleScale: 5.8, radius: 15, type: 'urban' },
  { name: "Xuhui District", coordinates: [31.1889, 121.4361], bortleScale: 8.6, radius: 20, type: 'urban' },
  { name: "Nanming District", coordinates: [26.5676, 106.7144], bortleScale: 6.2, radius: 15, type: 'urban' },
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7.7, radius: 25, type: 'urban' },
  { name: "Dongguan", coordinates: [23.0490, 113.7459], bortleScale: 7.8, radius: 25, type: 'urban' },
  { name: "Foshan", coordinates: [23.0218, 113.1220], bortleScale: 7.9, radius: 25, type: 'urban' },
  { name: "Guilin", coordinates: [25.2736, 110.2902], bortleScale: 6.3, radius: 15, type: 'urban' },
  { name: "Lijiang", coordinates: [26.8721, 100.2281], bortleScale: 5.1, radius: 10, type: 'urban' },
  { name: "Yangshuo", coordinates: [24.7781, 110.4960], bortleScale: 5.5, radius: 10, type: 'rural' },
  { name: "Fenghuang", coordinates: [27.9473, 109.5996], bortleScale: 5.2, radius: 10, type: 'rural' },
  { name: "Wuzhen", coordinates: [30.7485, 120.4868], bortleScale: 6.0, radius: 10, type: 'rural' },
  { name: "Zhouzhuang", coordinates: [31.1169, 120.8525], bortleScale: 6.1, radius: 10, type: 'rural' },
  { name: "Pingyao", coordinates: [37.2009, 112.1744], bortleScale: 5.8, radius: 10, type: 'rural' },
  { name: "Dali", coordinates: [25.6064, 100.2677], bortleScale: 5.4, radius: 15, type: 'rural' },
  { name: "Huangshan", coordinates: [29.7147, 118.3380], bortleScale: 4.8, radius: 15, type: 'rural' },
  { name: "Tongli", coordinates: [31.1808, 120.8530], bortleScale: 6.2, radius: 10, type: 'rural' },
  { name: "Leshan", coordinates: [29.5579, 103.7300], bortleScale: 6.5, radius: 15, type: 'urban' },
  { name: "Chongzuo", coordinates: [22.4154, 107.3674], bortleScale: 5.9, radius: 15, type: 'urban' },
  { name: "Beihai", coordinates: [21.4804, 109.1144], bortleScale: 6.4, radius: 15, type: 'urban' },
  { name: "Wuyishan", coordinates: [27.7560, 118.0345], bortleScale: 4.5, radius: 10, type: 'rural' },
  
  // Remote regions in China
  { name: "Dunhuang", coordinates: [40.1430, 94.6620], bortleScale: 3.7, radius: 20, type: 'rural' },
  { name: "Shangri-La", coordinates: [27.8, 99.7000], bortleScale: 3.5, radius: 15, type: 'rural' },
  { name: "Mohe", coordinates: [53.4833, 122.5333], bortleScale: 3.2, radius: 25, type: 'rural' },
  { name: "Arxan", coordinates: [47.1756, 119.9431], bortleScale: 3.8, radius: 15, type: 'rural' },
  { name: "Aletai", coordinates: [47.8449, 88.1451], bortleScale: 2.5, radius: 30, type: 'rural' },
  { name: "Kanas", coordinates: [48.7249, 86.9860], bortleScale: 2.1, radius: 40, type: 'natural' },
  { name: "Zhangjiajie", coordinates: [29.1174, 110.4794], bortleScale: 4.2, radius: 20, type: 'natural' },
  { name: "Huanglong", coordinates: [32.7500, 103.8333], bortleScale: 2.9, radius: 30, type: 'natural' },
  { name: "Jiuzhaigou", coordinates: [33.2000, 103.9000], bortleScale: 2.8, radius: 25, type: 'natural' },
  { name: "Qinghai Lake", coordinates: [36.8920, 100.1811], bortleScale: 2.3, radius: 40, type: 'natural' },
  
  // Dark sky locations with low light pollution
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1.0, radius: 60, type: 'dark-site' },
  { name: "La Palma", coordinates: [28.7136, -17.8834], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Great Basin", coordinates: [38.9332, -114.2687], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Big Bend", coordinates: [29.2498, -103.2502], bortleScale: 1.2, radius: 45, type: 'dark-site' },
  { name: "Rocky Mountain", coordinates: [40.3428, -105.6836], bortleScale: 2.5, radius: 30, type: 'dark-site' },
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 2.0, radius: 40, type: 'natural' },
  { name: "Grand Canyon", coordinates: [36.1069, -112.1129], bortleScale: 2.2, radius: 30, type: 'natural' },
  { name: "Yosemite", coordinates: [37.7331, -119.5874], bortleScale: 2.8, radius: 25, type: 'natural' },
  { name: "Banff", coordinates: [51.1788, -115.5708], bortleScale: 2.0, radius: 30, type: 'natural' },
  { name: "New Zealand Alps", coordinates: [-43.5321, 170.3865], bortleScale: 1.5, radius: 40, type: 'natural' },
  { name: "Uluru", coordinates: [-25.3444, 131.0369], bortleScale: 1.0, radius: 60, type: 'natural' },
  { name: "Everest Region", coordinates: [27.9881, 86.9250], bortleScale: 1.8, radius: 50, type: 'natural' },
  { name: "Australian Outback", coordinates: [-20.7359, 139.4962], bortleScale: 1.0, radius: 100, type: 'natural' },
  { name: "Baja California", coordinates: [23.4241, -110.2864], bortleScale: 2.0, radius: 40, type: 'natural' },
  { name: "Antarctica", coordinates: [77.8750, -166.0528], bortleScale: 1.0, radius: 200, type: 'dark-site' },
  { name: "Tibet", coordinates: [29.6500, 91.1000], bortleScale: 2.0, radius: 60, type: 'natural' }
];

/**
 * Find the closest location to given coordinates
 * @param latitude Current latitude
 * @param longitude Current longitude
 * @returns The closest location with distance and Bortle scale
 */
export function findClosestLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      name: `Unknown Location`,
      bortleScale: 5,
      distance: 0
    };
  }

  let closestLocation = {
    name: "",
    bortleScale: 5,
    distance: Number.MAX_VALUE,
    type: undefined
  };

  // Calculate distances to all known locations
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // If we're within the radius of a location, it's likely to have the same light pollution characteristics
    if (distance <= location.radius) {
      // If multiple locations match, prefer the closer one
      if (distance < closestLocation.distance) {
        closestLocation = {
          name: location.name,
          bortleScale: location.bortleScale,
          distance: distance,
          type: location.type
        };
      }
    }
    // Also track the absolute closest location overall
    else if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance,
        type: location.type
      };
    }
  }

  // If no close match found, generate an interpolated bortleScale based on surrounding areas
  if (closestLocation.distance > 100) {
    // Find the weighted average of the 3 closest locations
    const sortedLocations = [...locationDatabase]
      .map(loc => ({
        ...loc,
        distance: calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    
    // Calculate weighted Bortle scale (closer locations have more influence)
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    for (const loc of sortedLocations) {
      const weight = 1 / Math.max(1, loc.distance);
      totalWeight += weight;
      weightedBortleSum += loc.bortleScale * weight;
    }
    
    const estimatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
    
    return {
      name: `Area near ${closestLocation.name}`,
      bortleScale: estimatedBortle,
      distance: closestLocation.distance
    };
  }

  return closestLocation;
}

/**
 * Calculate distance between two points in km using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Get a friendly location name with accurate Bortle scale
 */
export function getLocationInfo(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  const result = findClosestLocation(latitude, longitude);
  
  // Format the name based on distance
  let formattedName = result.name;
  
  if (result.distance > 15 && result.distance <= 50) {
    formattedName = `Near ${result.name}`;
  } else if (result.distance > 50 && result.distance <= 100) {
    formattedName = `${result.name} region`;
  } else if (result.distance > 100) {
    formattedName = `Remote area`;
  }
  
  return {
    name: result.name,
    bortleScale: result.bortleScale,
    formattedName
  };
}

/**
 * Get Bortle scale description based on the value
 */
export function getBortleScaleDescription(bortleScale: number): string {
  // Round to the nearest integer for description lookup
  const scale = Math.min(9, Math.max(1, Math.round(bortleScale)));
  
  const descriptions = {
    1: "Excellent dark sky, Milky Way casts shadows",
    2: "Truly dark sky, Milky Way highly structured",
    3: "Rural sky, some light pollution but good detail",
    4: "Rural/suburban transition, moderate light pollution",
    5: "Suburban sky, Milky Way washed out overhead",
    6: "Bright suburban sky, Milky Way only at zenith",
    7: "Suburban/urban transition, no Milky Way visible",
    8: "City sky, can see only Moon, planets, brightest stars",
    9: "Inner city sky, only very brightest celestial objects visible"
  };
  
  return descriptions[scale as keyof typeof descriptions] || "Unknown light pollution level";
}

/**
 * Get Bortle scale color for visualization
 */
export function getBortleScaleColor(bortleScale: number): string {
  // Round to the nearest integer for color lookup
  const scale = Math.min(9, Math.max(1, Math.round(bortleScale)));
  
  const colors = {
    1: "#000033", // Near black/dark blue
    2: "#000066", // Very dark blue
    3: "#0000cc", // Dark blue
    4: "#0099ff", // Medium blue
    5: "#33cc33", // Green
    6: "#ffff00", // Yellow
    7: "#ff9900", // Orange
    8: "#ff0000", // Red
    9: "#ff00ff"  // Magenta
  };
  
  return colors[scale as keyof typeof colors] || "#ffffff";
}
