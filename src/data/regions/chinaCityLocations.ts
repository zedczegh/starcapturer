
import { LocationEntry } from "../locationDatabase";

/**
 * Chinese city-level locations with accurate Bortle scale values
 * Data sourced from 天气预报查询_国内城市_3387站.xlsx
 */
export const chinaCityLocations: LocationEntry[] = [
  // Major cities with accurate Bortle scale readings
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.7, radius: 50, type: 'urban' },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.8, radius: 50, type: 'urban' },
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 8.1, radius: 35, type: 'urban' },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7.8, radius: 35, type: 'urban' },
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 7.5, radius: 30, type: 'urban' },
  { name: "Chongqing", coordinates: [29.4316, 106.9123], bortleScale: 7.8, radius: 35, type: 'urban' },
  
  // Provincial capitals with accurate Bortle measurements
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7.6, radius: 30, type: 'urban' },
  { name: "Hangzhou", coordinates: [30.2741, 120.1551], bortleScale: 7.7, radius: 35, type: 'urban' },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7.9, radius: 35, type: 'urban' },
  { name: "Zhengzhou", coordinates: [34.7466, 113.6253], bortleScale: 7.5, radius: 25, type: 'urban' },
  { name: "Changsha", coordinates: [28.2282, 112.9388], bortleScale: 7.4, radius: 25, type: 'urban' },
  { name: "Fuzhou", coordinates: [26.0745, 119.2965], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Hefei", coordinates: [31.8201, 117.2272], bortleScale: 7.4, radius: 25, type: 'urban' },
  { name: "Nanchang", coordinates: [28.6820, 115.8579], bortleScale: 7.2, radius: 25, type: 'urban' },
  { name: "Kunming", coordinates: [25.0470, 102.7101], bortleScale: 6.9, radius: 25, type: 'urban' },
  
  // Northern cities
  { name: "Harbin", coordinates: [45.8038, 126.5350], bortleScale: 7.2, radius: 30, type: 'urban' },
  { name: "Shenyang", coordinates: [41.8057, 123.4315], bortleScale: 7.5, radius: 30, type: 'urban' },
  { name: "Changchun", coordinates: [43.8171, 125.3235], bortleScale: 7.0, radius: 25, type: 'urban' },
  { name: "Hohhot", coordinates: [40.8414, 111.7500], bortleScale: 7.0, radius: 25, type: 'urban' },
  
  // Western cities
  { name: "Lanzhou", coordinates: [36.0617, 103.8318], bortleScale: 6.8, radius: 25, type: 'urban' },
  { name: "Xining", coordinates: [36.6167, 101.7667], bortleScale: 6.7, radius: 25, type: 'urban' },
  { name: "Yinchuan", coordinates: [38.4863, 106.2394], bortleScale: 6.5, radius: 20, type: 'urban' },
  
  // Southwestern cities
  { name: "Guiyang", coordinates: [26.6470, 106.6302], bortleScale: 6.8, radius: 25, type: 'urban' },
  { name: "Nanning", coordinates: [22.8170, 108.3665], bortleScale: 6.7, radius: 20, type: 'urban' },

  // Medium-sized cities
  { name: "Dalian", coordinates: [38.9140, 121.6147], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Qingdao", coordinates: [36.0671, 120.3826], bortleScale: 7.3, radius: 25, type: 'urban' },
  { name: "Xiamen", coordinates: [24.4798, 118.0819], bortleScale: 7.0, radius: 20, type: 'urban' },
  { name: "Ningbo", coordinates: [29.8683, 121.5440], bortleScale: 7.2, radius: 25, type: 'urban' },
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7.7, radius: 25, type: 'urban' },
  { name: "Jinan", coordinates: [36.6683, 116.9972], bortleScale: 7.4, radius: 25, type: 'urban' },
  { name: "Wuxi", coordinates: [31.5700, 120.3000], bortleScale: 7.5, radius: 20, type: 'urban' },
  { name: "Changzhou", coordinates: [31.8120, 119.9740], bortleScale: 7.3, radius: 20, type: 'urban' },
  { name: "Foshan", coordinates: [23.0218, 113.1220], bortleScale: 7.9, radius: 25, type: 'urban' },
  { name: "Dongguan", coordinates: [23.0490, 113.7459], bortleScale: 7.8, radius: 25, type: 'urban' },
  
  // Lesser-known cities with good observation potential
  { name: "Dunhuang", coordinates: [40.1425, 94.6618], bortleScale: 3.7, radius: 20, type: 'rural' },
  { name: "Mohe", coordinates: [53.4833, 122.5333], bortleScale: 3.2, radius: 25, type: 'rural' },
  { name: "Shangri-La", coordinates: [27.8000, 99.7000], bortleScale: 3.5, radius: 15, type: 'rural' },
];
