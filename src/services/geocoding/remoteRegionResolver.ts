
import { Language } from '../geocoding/types';
import { calculateDistance } from '../../data/utils/distanceCalculator';

// Key cities in remote regions with accurate geocoding
const remoteCities = [
  // Tibet
  { name: 'Lhasa', chineseName: '拉萨', coordinates: [29.6500, 91.1000], region: 'tibet' },
  { name: 'Shigatse', chineseName: '日喀则', coordinates: [29.2667, 88.8833], region: 'tibet' },
  { name: 'Lhoka', chineseName: '山南', coordinates: [29.2333, 91.7667], region: 'tibet' },
  { name: 'Nyingchi', chineseName: '林芝', coordinates: [29.6500, 94.3500], region: 'tibet' },
  { name: 'Qamdo', chineseName: '昌都', coordinates: [31.1500, 97.1800], region: 'tibet' },
  { name: 'Nagqu', chineseName: '那曲', coordinates: [31.4800, 92.0500], region: 'tibet' },
  
  // Xinjiang
  { name: 'Urumqi', chineseName: '乌鲁木齐', coordinates: [43.8256, 87.6168], region: 'xinjiang' },
  { name: 'Kashgar', chineseName: '喀什', coordinates: [39.4700, 75.9800], region: 'xinjiang' },
  { name: 'Turpan', chineseName: '吐鲁番', coordinates: [42.9480, 89.1849], region: 'xinjiang' },
  { name: 'Hami', chineseName: '哈密', coordinates: [42.8278, 93.5147], region: 'xinjiang' },
  { name: 'Aksu', chineseName: '阿克苏', coordinates: [41.1637, 80.2605], region: 'xinjiang' },
  
  // Inner Mongolia
  { name: 'Hohhot', chineseName: '呼和浩特', coordinates: [40.8414, 111.7500], region: 'inner-mongolia' },
  { name: 'Baotou', chineseName: '包头', coordinates: [40.6562, 109.8345], region: 'inner-mongolia' },
  { name: 'Ordos', chineseName: '鄂尔多斯', coordinates: [39.6080, 109.7813], region: 'inner-mongolia' },
  
  // Northeast China
  { name: 'Harbin', chineseName: '哈尔滨', coordinates: [45.8038, 126.5350], region: 'northeast' },
  { name: 'Changchun', chineseName: '长春', coordinates: [43.8800, 125.3228], region: 'northeast' },
  { name: 'Shenyang', chineseName: '沈阳', coordinates: [41.8057, 123.4315], region: 'northeast' }
];

/**
 * Identifies if coordinates are within a known remote region
 */
export function identifyRemoteRegion(latitude: number, longitude: number): string | null {
  if (latitude > 27 && latitude < 33 && longitude > 85 && longitude < 95) {
    return 'tibet';
  }
  if (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) {
    return 'xinjiang';
  }
  if (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) {
    return 'inner-mongolia';
  }
  if (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135) {
    return 'northeast';
  }
  return null;
}

/**
 * Finds the closest remote city to given coordinates
 */
export function findClosestRemoteCity(latitude: number, longitude: number): {
  name: string; 
  chineseName: string;
  coordinates: [number, number];
  distance: number;
  region: string;
} | null {
  let closestCity = null;
  let minDistance = Number.MAX_VALUE;
  
  for (const city of remoteCities) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      city.coordinates[0], 
      city.coordinates[1]
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = {
        ...city,
        distance
      };
    }
  }
  
  return closestCity;
}

/**
 * Enhances location name for remote regions
 * Helps with proper geocoding when standard services might fail
 */
export function enhanceRemoteLocationName(
  latitude: number, 
  longitude: number, 
  originalName: string | null,
  language: Language
): string {
  // If we already have a good name, use it
  if (originalName && originalName.length > 3 && !originalName.includes('°')) {
    return originalName;
  }
  
  const region = identifyRemoteRegion(latitude, longitude);
  if (!region) {
    return originalName || 
      (language === 'en' 
        ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
        : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
  }
  
  // Find closest city in the remote region
  const closestCity = findClosestRemoteCity(latitude, longitude);
  if (!closestCity) {
    // If no city found, return generic region name
    if (region === 'tibet') {
      return language === 'en' ? 'Tibet Region' : '西藏地区';
    } else if (region === 'xinjiang') {
      return language === 'en' ? 'Xinjiang Region' : '新疆地区';
    } else if (region === 'inner-mongolia') {
      return language === 'en' ? 'Inner Mongolia Region' : '内蒙古地区';
    } else if (region === 'northeast') {
      return language === 'en' ? 'Northeast China' : '中国东北地区';
    }
  }
  
  // Format based on distance to closest city
  if (closestCity) {
    const cityName = language === 'en' ? closestCity.name : closestCity.chineseName;
    
    if (closestCity.distance <= 15) {
      return cityName;
    } else if (closestCity.distance <= 50) {
      return language === 'en' ? `Near ${cityName}` : `${cityName}附近`;
    } else if (closestCity.distance <= 100) {
      return language === 'en' ? `${cityName} Region` : `${cityName}地区`;
    } else {
      // For very distant locations, return region name
      if (region === 'tibet') {
        return language === 'en' ? 'Tibet Region' : '西藏地区';
      } else if (region === 'xinjiang') {
        return language === 'en' ? 'Xinjiang Region' : '新疆地区';
      } else if (region === 'inner-mongolia') {
        return language === 'en' ? 'Inner Mongolia Region' : '内蒙古地区';
      } else if (region === 'northeast') {
        return language === 'en' ? 'Northeast China' : '中国东北地区';
      }
    }
  }
  
  // Default fallback
  return originalName || 
    (language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
}
