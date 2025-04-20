/**
 * Enhanced database for China's Bortle scale
 * This provides more accurate light pollution data for Chinese locations
 */

// Bounding box for China's territory
const CHINA_BOUNDS = {
  minLat: 18.0,
  maxLat: 53.0,
  minLng: 73.0,
  maxLng: 135.0
};

// Region definitions for mainland China
const CHINA_REGIONS = [
  { name: 'Tibet', minLat: 27.0, maxLat: 37.0, minLng: 78.0, maxLng: 96.0 },
  { name: 'Xinjiang', minLat: 34.0, maxLat: 49.0, minLng: 73.0, maxLng: 96.0 },
  { name: 'Qinghai', minLat: 31.0, maxLat: 39.0, minLng: 89.0, maxLng: 103.0 },
  { name: 'Inner Mongolia', minLat: 37.0, maxLat: 53.0, minLng: 97.0, maxLng: 126.0 },
  { name: 'Gansu', minLat: 32.0, maxLat: 43.0, minLng: 92.0, maxLng: 108.0 },
  { name: 'Heilongjiang', minLat: 43.0, maxLat: 53.0, minLng: 121.0, maxLng: 135.0 },
  { name: 'Jilin', minLat: 40.0, maxLat: 46.0, minLng: 121.0, maxLng: 131.0 },
  { name: 'Liaoning', minLat: 38.0, maxLat: 43.0, minLng: 118.0, maxLng: 126.0 },
  { name: 'Sichuan', minLat: 26.0, maxLat: 34.0, minLng: 97.0, maxLng: 108.0 },
  { name: 'Yunnan', minLat: 21.0, maxLat: 29.0, minLng: 97.0, maxLng: 106.0 }
];

// Define major cities with known Bortle scales
type CityEntry = {
  name: string;
  chineseName?: string;
  lat: number;
  lng: number;
  bortleScale: number;
  radius: number; // km
};

// Enhanced database with more cities and better accuracy
const CHINA_CITIES: CityEntry[] = [
  // Major metropolitan areas
  { name: 'Beijing', chineseName: '北京', lat: 39.9042, lng: 116.4074, bortleScale: 9, radius: 70 },
  { name: 'Shanghai', chineseName: '上海', lat: 31.2304, lng: 121.4737, bortleScale: 9, radius: 70 },
  { name: 'Guangzhou', chineseName: '广州', lat: 23.1291, lng: 113.2644, bortleScale: 9, radius: 65 },
  { name: 'Shenzhen', chineseName: '深圳', lat: 22.5431, lng: 114.0579, bortleScale: 9, radius: 60 },
  { name: 'Chongqing', chineseName: '重庆', lat: 29.4316, lng: 106.9123, bortleScale: 8, radius: 60 },
  { name: 'Tianjin', chineseName: '天津', lat: 39.3434, lng: 117.3616, bortleScale: 8, radius: 60 },
  { name: 'Chengdu', chineseName: '成都', lat: 30.5728, lng: 104.0668, bortleScale: 8, radius: 55 },
  { name: 'Wuhan', chineseName: '武汉', lat: 30.5928, lng: 114.3055, bortleScale: 8, radius: 55 },
  { name: 'Hangzhou', chineseName: '杭州', lat: 30.2741, lng: 120.1551, bortleScale: 8, radius: 50 },
  { name: 'Shenyang', chineseName: '沈阳', lat: 41.8057, lng: 123.4315, bortleScale: 8, radius: 50 },
  
  // Provincial capitals and major cities
  { name: 'Xian', chineseName: '西安', lat: 34.3416, lng: 108.9398, bortleScale: 8, radius: 45 },
  { name: 'Nanjing', chineseName: '南京', lat: 32.0617, lng: 118.7778, bortleScale: 8, radius: 45 },
  { name: 'Changsha', chineseName: '长沙', lat: 28.2282, lng: 112.9388, bortleScale: 7, radius: 40 },
  { name: 'Jinan', chineseName: '济南', lat: 36.6512, lng: 117.1201, bortleScale: 7, radius: 40 },
  { name: 'Harbin', chineseName: '哈尔滨', lat: 45.8038, lng: 126.5347, bortleScale: 7, radius: 40 },
  { name: 'Zhengzhou', chineseName: '郑州', lat: 34.7466, lng: 113.6253, bortleScale: 7, radius: 40 },
  { name: 'Qingdao', chineseName: '青岛', lat: 36.0671, lng: 120.3826, bortleScale: 7, radius: 40 },
  { name: 'Dalian', chineseName: '大连', lat: 38.9140, lng: 121.6147, bortleScale: 7, radius: 35 },
  { name: 'Lanzhou', chineseName: '兰州', lat: 36.0611, lng: 103.8343, bortleScale: 7, radius: 35 },
  { name: 'Kunming', chineseName: '昆明', lat: 25.0389, lng: 102.7183, bortleScale: 7, radius: 35 },
  
  // Western province capitals
  { name: 'Urumqi', chineseName: '乌鲁木齐', lat: 43.8256, lng: 87.6168, bortleScale: 7, radius: 40 },
  { name: 'Lhasa', chineseName: '拉萨', lat: 29.6500, lng: 91.1000, bortleScale: 6, radius: 30 },
  { name: 'Xining', chineseName: '西宁', lat: 36.6171, lng: 101.7660, bortleScale: 7, radius: 35 },
  { name: 'Yinchuan', chineseName: '银川', lat: 38.4872, lng: 106.2309, bortleScale: 7, radius: 35 },
  
  // Other significant cities
  { name: 'Changchun', chineseName: '长春', lat: 43.8171, lng: 125.3235, bortleScale: 7, radius: 40 },
  { name: 'Nanchang', chineseName: '南昌', lat: 28.6820, lng: 115.8580, bortleScale: 7, radius: 35 },
  { name: 'Fuzhou', chineseName: '福州', lat: 26.0745, lng: 119.2965, bortleScale: 7, radius: 35 },
  { name: 'Xiamen', chineseName: '厦门', lat: 24.4798, lng: 118.0894, bortleScale: 7, radius: 30 },
  { name: 'Shantou', chineseName: '汕头', lat: 23.3700, lng: 116.6900, bortleScale: 7, radius: 30 },
  
  // Smaller provincial cities
  { name: 'Hohhot', chineseName: '呼和浩特', lat: 40.8151, lng: 111.6629, bortleScale: 7, radius: 30 },
  { name: 'Baotou', chineseName: '包头', lat: 40.6564, lng: 109.8450, bortleScale: 7, radius: 30 },
  { name: 'Ordos', chineseName: '鄂尔多斯', lat: 39.6087, lng: 109.7720, bortleScale: 6, radius: 25 },
  { name: 'Haikou', chineseName: '海口', lat: 20.0444, lng: 110.3234, bortleScale: 7, radius: 30 },
  { name: 'Sanya', chineseName: '三亚', lat: 18.2525, lng: 109.5083, bortleScale: 6, radius: 25 },
  
  // Dark sky sites in China
  { name: 'Nagqu', chineseName: '那曲', lat: 31.4762, lng: 92.0573, bortleScale: 2, radius: 200 },
  { name: 'Ali Prefecture', chineseName: '阿里地区', lat: 32.5, lng: 80.1, bortleScale: 1, radius: 300 },
  { name: 'Qiangtang Nature Reserve', chineseName: '羌塘自然保护区', lat: 34.7, lng: 86.2, bortleScale: 1, radius: 300 },
  { name: 'Kekexili', chineseName: '可可西里', lat: 35.6, lng: 92.8, bortleScale: 1, radius: 250 },
  { name: 'Altun Mountains', chineseName: '阿尔金山', lat: 39.2, lng: 88.4, bortleScale: 2, radius: 200 },
  { name: 'Hulunbuir Grassland', chineseName: '呼伦贝尔草原', lat: 49.2122, lng: 119.7536, bortleScale: 2, radius: 150 }
];

/**
 * Check if coordinates are within China's boundaries
 */
export function isInChina(latitude: number, longitude: number): boolean {
  return (
    latitude >= CHINA_BOUNDS.minLat &&
    latitude <= CHINA_BOUNDS.maxLat &&
    longitude >= CHINA_BOUNDS.minLng &&
    longitude <= CHINA_BOUNDS.maxLng
  );
}

/**
 * Get the region within China for given coordinates
 */
export function getChineseRegion(latitude: number, longitude: number): string | null {
  if (!isInChina(latitude, longitude)) {
    return null;
  }
  
  for (const region of CHINA_REGIONS) {
    if (
      latitude >= region.minLat &&
      latitude <= region.maxLat &&
      longitude >= region.minLng &&
      longitude <= region.maxLng
    ) {
      return region.name;
    }
  }
  
  return 'Other China';
}

/**
 * Calculate Bortle scale for a specific city
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  // Skip invalid coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  let closestCity: CityEntry | null = null;
  let minDistance = Infinity;
  
  // Find closest city
  for (const city of CHINA_CITIES) {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (city.lat - latitude) * Math.PI / 180;
    const dLon = (city.lng - longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latitude * Math.PI / 180) * Math.cos(city.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  
  // Return Bortle scale if within city's radius of influence
  if (closestCity && minDistance < closestCity.radius) {
    // Calculate decay based on distance from center
    const distanceRatio = minDistance / closestCity.radius;
    
    // Linear decay from city center (slower decay for larger cities)
    let scaleDrop = distanceRatio * (closestCity.radius > 50 ? 2.0 : 2.5);
    
    // Cap the maximum drop
    scaleDrop = Math.min(scaleDrop, closestCity.bortleScale - 1);
    
    const adjustedScale = closestCity.bortleScale - scaleDrop;
    return Math.max(1, Math.min(9, adjustedScale));
  }
  
  return null;
}
