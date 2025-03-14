
/**
 * Comprehensive database of Bortle scale values for Chinese cities and towns
 * This centralized database makes it easier to maintain and update light pollution data
 */

export interface CityBortleData {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number; // km - influence radius
  type: 'urban' | 'suburban' | 'rural' | 'natural';
  region?: string; // Province or region
}

// Main cities of China organized by region
export const chinaCityBortleData: CityBortleData[] = [
  // Major Eastern Cities
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.5, radius: 50, type: 'urban', region: 'Beijing' },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.5, radius: 50, type: 'urban', region: 'Shanghai' },
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 7.8, radius: 30, type: 'urban', region: 'Guangdong' },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 7.8, radius: 30, type: 'urban', region: 'Guangdong' },
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8.5, radius: 30, type: 'urban', region: 'Hong Kong SAR' },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7.5, radius: 30, type: 'urban', region: 'Sichuan' },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7.5, radius: 30, type: 'urban', region: 'Hubei' },
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7.5, radius: 30, type: 'urban', region: 'Jiangsu' },
  { name: "Hangzhou", coordinates: [30.2741, 120.1552], bortleScale: 7.5, radius: 30, type: 'urban', region: 'Zhejiang' },
  { name: "Tianjin", coordinates: [39.3434, 117.3616], bortleScale: 7.5, radius: 30, type: 'urban', region: 'Tianjin' },
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7.3, radius: 25, type: 'urban', region: 'Jiangsu' },
  { name: "Dongguan", coordinates: [23.0207, 113.7518], bortleScale: 7.5, radius: 25, type: 'urban', region: 'Guangdong' },
  { name: "Foshan", coordinates: [23.0229, 113.1322], bortleScale: 7.5, radius: 25, type: 'urban', region: 'Guangdong' },
  { name: "Zhengzhou", coordinates: [34.7533, 113.6653], bortleScale: 7.3, radius: 25, type: 'urban', region: 'Henan' },
  { name: "Kunming", coordinates: [25.0389, 102.7183], bortleScale: 7.2, radius: 25, type: 'urban', region: 'Yunnan' },
  
  // Shaanxi Province
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 7.3, radius: 30, type: 'urban', region: 'Shaanxi' },
  { name: "Xianyang", coordinates: [34.3470, 108.7167], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Shaanxi' },
  { name: "Baoji", coordinates: [34.3609, 107.2372], bortleScale: 6.5, radius: 20, type: 'urban', region: 'Shaanxi' },
  { name: "Weinan", coordinates: [34.5026, 109.5035], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Shaanxi' },
  { name: "Hanzhong", coordinates: [33.0732, 107.0302], bortleScale: 6.0, radius: 15, type: 'urban', region: 'Shaanxi' },
  { name: "Ankang", coordinates: [32.6877, 109.0235], bortleScale: 5.8, radius: 15, type: 'urban', region: 'Shaanxi' },
  { name: "Shangluo", coordinates: [33.8644, 109.9292], bortleScale: 5.5, radius: 12, type: 'urban', region: 'Shaanxi' },
  { name: "Tongchuan", coordinates: [35.0806, 109.0903], bortleScale: 5.7, radius: 12, type: 'urban', region: 'Shaanxi' },
  { name: "Yan'an", coordinates: [36.5853, 109.4898], bortleScale: 5.5, radius: 15, type: 'urban', region: 'Shaanxi' },
  { name: "Yulin", coordinates: [38.2855, 109.7348], bortleScale: 6.0, radius: 15, type: 'urban', region: 'Shaanxi' },
  
  // Xinjiang Uyghur Autonomous Region
  { name: "Urumqi", coordinates: [43.8256, 87.6168], bortleScale: 7.8, radius: 25, type: 'urban', region: 'Xinjiang' },
  { name: "Kashgar", coordinates: [39.4700, 75.9800], bortleScale: 7.2, radius: 20, type: 'urban', region: 'Xinjiang' },
  { name: "Turpan", coordinates: [42.9480, 89.1849], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Xinjiang' },
  { name: "Hami", coordinates: [42.8278, 93.5147], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Xinjiang' },
  { name: "Aksu", coordinates: [41.7276, 82.9835], bortleScale: 6.8, radius: 15, type: 'urban', region: 'Xinjiang' },
  { name: "Yining", coordinates: [43.9978, 81.3304], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Xinjiang' },
  { name: "Korla", coordinates: [41.7257, 86.1742], bortleScale: 6.7, radius: 15, type: 'urban', region: 'Xinjiang' },
  
  // Tibet Autonomous Region
  { name: "Lhasa", coordinates: [29.6500, 91.1000], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Tibet' },
  { name: "Shigatse", coordinates: [29.2667, 88.8833], bortleScale: 6.2, radius: 15, type: 'urban', region: 'Tibet' },
  { name: "Chamdo", coordinates: [31.1480, 97.1700], bortleScale: 5.8, radius: 12, type: 'urban', region: 'Tibet' },
  { name: "Nyingchi", coordinates: [29.6490, 94.3613], bortleScale: 5.5, radius: 12, type: 'urban', region: 'Tibet' },
  { name: "Lhoka", coordinates: [29.2367, 91.7612], bortleScale: 5.8, radius: 12, type: 'urban', region: 'Tibet' },
  { name: "Nagqu", coordinates: [31.4680, 92.0510], bortleScale: 5.5, radius: 10, type: 'urban', region: 'Tibet' },
  
  // Qinghai Province
  { name: "Xining", coordinates: [36.6167, 101.7667], bortleScale: 7.0, radius: 22, type: 'urban', region: 'Qinghai' },
  { name: "Golmud", coordinates: [36.4167, 94.9000], bortleScale: 6.2, radius: 15, type: 'urban', region: 'Qinghai' },
  { name: "Delingha", coordinates: [37.3700, 100.6300], bortleScale: 5.8, radius: 10, type: 'urban', region: 'Qinghai' },
  { name: "Yushu", coordinates: [33.0091, 97.0088], bortleScale: 5.5, radius: 10, type: 'urban', region: 'Qinghai' },
  { name: "Guide", coordinates: [36.0419, 101.4336], bortleScale: 5.3, radius: 8, type: 'urban', region: 'Qinghai' },
  { name: "Menyuan", coordinates: [37.3895, 101.6174], bortleScale: 4.8, radius: 8, type: 'urban', region: 'Qinghai' },
  { name: "Gonghe", coordinates: [36.2667, 100.6200], bortleScale: 5.0, radius: 8, type: 'urban', region: 'Qinghai' },
  
  // Gansu Province
  { name: "Lanzhou", coordinates: [36.0617, 103.8348], bortleScale: 7.2, radius: 20, type: 'urban', region: 'Gansu' },
  { name: "Jiayuguan", coordinates: [39.7732, 98.2890], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Gansu' },
  { name: "Dunhuang", coordinates: [39.9990, 94.6694], bortleScale: 6.0, radius: 12, type: 'urban', region: 'Gansu' },
  { name: "Zhangye", coordinates: [38.9336, 100.4550], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Gansu' },
  { name: "Wuwei", coordinates: [37.9283, 102.6371], bortleScale: 6.2, radius: 12, type: 'urban', region: 'Gansu' },
  { name: "Tianshui", coordinates: [34.5802, 105.7452], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Gansu' },
  { name: "Pingliang", coordinates: [35.5434, 106.6694], bortleScale: 6.0, radius: 12, type: 'urban', region: 'Gansu' },
  { name: "Qingyang", coordinates: [35.7249, 107.6442], bortleScale: 5.8, radius: 12, type: 'urban', region: 'Gansu' },
  
  // Inner Mongolia Autonomous Region
  { name: "Hohhot", coordinates: [40.8414, 111.7500], bortleScale: 7.3, radius: 25, type: 'urban', region: 'Inner Mongolia' },
  { name: "Baotou", coordinates: [40.6562, 109.8345], bortleScale: 7.4, radius: 25, type: 'urban', region: 'Inner Mongolia' },
  { name: "Ordos", coordinates: [39.6080, 109.7813], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Inner Mongolia' },
  { name: "Chifeng", coordinates: [42.2682, 118.9582], bortleScale: 6.9, radius: 20, type: 'urban', region: 'Inner Mongolia' },
  { name: "Tongliao", coordinates: [43.6172, 122.2633], bortleScale: 6.7, radius: 18, type: 'urban', region: 'Inner Mongolia' },
  { name: "Hulunbuir", coordinates: [49.2122, 119.7656], bortleScale: 6.5, radius: 18, type: 'urban', region: 'Inner Mongolia' },
  { name: "Bayannur", coordinates: [40.7436, 107.3883], bortleScale: 6.2, radius: 15, type: 'urban', region: 'Inner Mongolia' },
  { name: "Ulanqab", coordinates: [41.0300, 113.1143], bortleScale: 6.1, radius: 15, type: 'urban', region: 'Inner Mongolia' },
  { name: "Xilin Gol", coordinates: [43.9440, 116.0806], bortleScale: 5.5, radius: 12, type: 'urban', region: 'Inner Mongolia' },
  
  // Northeastern China (Dongbei)
  { name: "Harbin", coordinates: [45.8038, 126.5350], bortleScale: 7.6, radius: 30, type: 'urban', region: 'Heilongjiang' },
  { name: "Changchun", coordinates: [43.8800, 125.3228], bortleScale: 7.5, radius: 28, type: 'urban', region: 'Jilin' },
  { name: "Shenyang", coordinates: [41.8057, 123.4315], bortleScale: 7.7, radius: 30, type: 'urban', region: 'Liaoning' },
  { name: "Dalian", coordinates: [38.9140, 121.6147], bortleScale: 7.5, radius: 25, type: 'urban', region: 'Liaoning' },
  { name: "Jilin City", coordinates: [43.8384, 126.5836], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Jilin' },
  { name: "Qiqihar", coordinates: [47.3523, 123.9181], bortleScale: 6.5, radius: 18, type: 'urban', region: 'Heilongjiang' },
  { name: "Daqing", coordinates: [46.5900, 125.1000], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Heilongjiang' },
  { name: "Anshan", coordinates: [41.1087, 122.9900], bortleScale: 7.0, radius: 20, type: 'urban', region: 'Liaoning' },
  { name: "Fushun", coordinates: [41.8708, 123.9371], bortleScale: 6.8, radius: 18, type: 'urban', region: 'Liaoning' },
  { name: "Jixi", coordinates: [45.3010, 130.9697], bortleScale: 6.0, radius: 15, type: 'urban', region: 'Heilongjiang' },
  { name: "Mudanjiang", coordinates: [44.5861, 129.6008], bortleScale: 6.5, radius: 18, type: 'urban', region: 'Heilongjiang' },
  
  // Western Sichuan
  { name: "Kangding", coordinates: [30.0576, 101.9644], bortleScale: 6.0, radius: 15, type: 'urban', region: 'Sichuan' },
  { name: "Aba", coordinates: [31.9977, 102.2262], bortleScale: 5.8, radius: 12, type: 'urban', region: 'Sichuan' },
  { name: "Garze", coordinates: [31.6225, 100.0028], bortleScale: 5.5, radius: 12, type: 'urban', region: 'Sichuan' },
  { name: "Ya'an", coordinates: [30.0131, 103.0424], bortleScale: 6.2, radius: 15, type: 'urban', region: 'Sichuan' },
  { name: "Mianyang", coordinates: [31.4724, 104.7793], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Sichuan' },
  { name: "Leshan", coordinates: [29.5821, 103.7647], bortleScale: 6.7, radius: 18, type: 'urban', region: 'Sichuan' },
  { name: "Neijiang", coordinates: [29.5821, 105.0593], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Sichuan' },
  { name: "Zigong", coordinates: [29.3402, 104.7810], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Sichuan' },
  
  // Yunnan Province
  { name: "Shangri-La", coordinates: [27.8360, 99.7072], bortleScale: 5.5, radius: 15, type: 'urban', region: 'Yunnan' },
  { name: "Dali", coordinates: [25.6001, 100.2681], bortleScale: 6.8, radius: 18, type: 'urban', region: 'Yunnan' },
  { name: "Lijiang", coordinates: [26.8553, 100.2271], bortleScale: 6.5, radius: 18, type: 'urban', region: 'Yunnan' },
  { name: "Tengchong", coordinates: [25.0207, 98.4956], bortleScale: 5.8, radius: 12, type: 'urban', region: 'Yunnan' },
  { name: "Xishuangbanna", coordinates: [22.0094, 100.7974], bortleScale: 6.0, radius: 15, type: 'urban', region: 'Yunnan' },
  { name: "Baoshan", coordinates: [25.1130, 99.1647], bortleScale: 6.2, radius: 15, type: 'urban', region: 'Yunnan' },
  { name: "Yuxi", coordinates: [24.3354, 102.5435], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Yunnan' },
  { name: "Qujing", coordinates: [25.4897, 103.7962], bortleScale: 6.5, radius: 18, type: 'urban', region: 'Yunnan' },
  
  // Guizhou Province
  { name: "Guiyang", coordinates: [26.6470, 106.6302], bortleScale: 7.2, radius: 25, type: 'urban', region: 'Guizhou' },
  { name: "Zunyi", coordinates: [27.7063, 106.9377], bortleScale: 6.8, radius: 20, type: 'urban', region: 'Guizhou' },
  { name: "Kaili", coordinates: [26.5682, 107.9803], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Guizhou' },
  { name: "Duyun", coordinates: [26.2593, 107.5127], bortleScale: 6.0, radius: 12, type: 'urban', region: 'Guizhou' },
  { name: "Xingyi", coordinates: [25.0920, 104.8948], bortleScale: 6.2, radius: 15, type: 'urban', region: 'Guizhou' },
  { name: "Anshun", coordinates: [26.2459, 105.9472], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Guizhou' },
  { name: "Bijie", coordinates: [27.3017, 105.2863], bortleScale: 6.0, radius: 12, type: 'urban', region: 'Guizhou' },
  { name: "Tongren", coordinates: [27.7176, 109.1910], bortleScale: 6.0, radius: 12, type: 'urban', region: 'Guizhou' },
  
  // Jiangxi Province
  { name: "Nanchang", coordinates: [28.6830, 115.8580], bortleScale: 7.3, radius: 25, type: 'urban', region: 'Jiangxi' },
  { name: "Jiujiang", coordinates: [29.7354, 116.0013], bortleScale: 6.8, radius: 18, type: 'urban', region: 'Jiangxi' },
  { name: "Ganzhou", coordinates: [25.8452, 114.9335], bortleScale: 6.7, radius: 18, type: 'urban', region: 'Jiangxi' },
  { name: "Shangrao", coordinates: [28.4419, 117.9633], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Jiangxi' },
  { name: "Yichun", coordinates: [27.8041, 114.3880], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Jiangxi' },
  { name: "Jingdezhen", coordinates: [29.2920, 117.2074], bortleScale: 6.3, radius: 15, type: 'urban', region: 'Jiangxi' },
  
  // Anhui Province
  { name: "Hefei", coordinates: [31.8206, 117.2272], bortleScale: 7.4, radius: 25, type: 'urban', region: 'Anhui' },
  { name: "Wuhu", coordinates: [31.3520, 118.3708], bortleScale: 6.8, radius: 18, type: 'urban', region: 'Anhui' },
  { name: "Huangshan", coordinates: [29.7147, 118.3380], bortleScale: 5.5, radius: 15, type: 'urban', region: 'Anhui' },
  { name: "Bengbu", coordinates: [32.9162, 117.3889], bortleScale: 6.7, radius: 18, type: 'urban', region: 'Anhui' },
  { name: "Anqing", coordinates: [30.5087, 117.0430], bortleScale: 6.5, radius: 15, type: 'urban', region: 'Anhui' },
  { name: "Ma'anshan", coordinates: [31.6694, 118.5065], bortleScale: 6.7, radius: 15, type: 'urban', region: 'Anhui' },
  
  // Additional provinces can be added in the future as needed
];

/**
 * Find the Bortle scale for a specific city based on coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Bortle scale value or null if no match found
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  for (const city of chinaCityBortleData) {
    const [cityLat, cityLng] = city.coordinates;
    
    // Check if coordinates are within city radius (simple approximation)
    // 0.01 degree is roughly 1km at the equator, adjusted for latitude
    const latRange = city.radius * 0.01 / Math.cos(cityLat * Math.PI / 180);
    const lngRange = city.radius * 0.01;
    
    if (
      Math.abs(latitude - cityLat) <= latRange &&
      Math.abs(longitude - cityLng) <= lngRange
    ) {
      return city.bortleScale;
    }
  }
  
  return null;
}

/**
 * Check if coordinates are in a Chinese province
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Boolean indicating if in China
 */
export function isInChina(latitude: number, longitude: number): boolean {
  // Rough bounding box for mainland China
  return (
    latitude >= 18 && latitude <= 54 &&
    longitude >= 73 && longitude <= 135
  );
}

/**
 * Get the region/province of China for given coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Region name or null if not found
 */
export function getChineseRegion(latitude: number, longitude: number): string | null {
  if (!isInChina(latitude, longitude)) {
    return null;
  }
  
  // Check for specific regions based on coordinates
  if (latitude > 27 && latitude < 37 && longitude > 78 && longitude < 95) {
    return 'Tibet';
  }
  
  if (latitude > 34 && latitude < 50 && longitude > 73 && longitude < 94) {
    return 'Xinjiang';
  }
  
  if (latitude > 32 && latitude < 39 && longitude > 89 && longitude < 103) {
    return 'Qinghai';
  }
  
  if (latitude > 32 && latitude < 43 && longitude > 92 && longitude < 108) {
    return 'Gansu';
  }
  
  if (latitude > 37 && latitude < 54 && longitude > 97 && longitude < 126) {
    return 'Inner Mongolia';
  }
  
  // Find closest city and use its region
  let closestCity = null;
  let shortestDistance = Infinity;
  
  for (const city of chinaCityBortleData) {
    const [cityLat, cityLng] = city.coordinates;
    const distance = Math.sqrt(
      Math.pow(latitude - cityLat, 2) + 
      Math.pow(longitude - cityLng, 2)
    );
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestCity = city;
    }
  }
  
  return closestCity?.region || null;
}
