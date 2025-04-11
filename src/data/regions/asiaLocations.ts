
import { LocationEntry } from "../locationDatabase";

/**
 * Asian locations with accurate Bortle scale values
 */
export const asiaLocations: LocationEntry[] = [
  // Major Chinese cities
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8.7, radius: 30, type: 'urban' },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.7, radius: 50, type: 'urban' },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.8, radius: 50, type: 'urban' },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 8.9, radius: 55, type: 'urban' },
  { name: "Seoul", coordinates: [37.5665, 126.9780], bortleScale: 8.6, radius: 45, type: 'urban' },
  { name: "Singapore", coordinates: [1.3521, 103.8198], bortleScale: 8.5, radius: 30, type: 'urban' },
  
  // Other major Asian cities
  { name: "Mumbai", coordinates: [19.0760, 72.8777], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "Delhi", coordinates: [28.6139, 77.2090], bortleScale: 8.6, radius: 45, type: 'urban' },
  
  // Chinese cities and towns
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
  
  // Remote regions in China and Asia
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
  
  // Asian natural sites
  { name: "Everest Region", coordinates: [27.9881, 86.9250], bortleScale: 1.8, radius: 50, type: 'natural' },
  { name: "Tibet", coordinates: [29.6500, 91.1000], bortleScale: 2.0, radius: 60, type: 'natural' },
  { name: "Sagarmatha", coordinates: [27.9881, 86.9250], bortleScale: 2.0, radius: 50, type: 'natural' },
  { name: "Tibetan Plateau", coordinates: [33.0000, 86.0000], bortleScale: 1.5, radius: 60, type: 'natural' },
  { name: "Iriomote Island", coordinates: [24.3858, 123.8161], bortleScale: 2.0, radius: 15, type: 'natural' },
  
  // IDA Certified Dark Sky Places in Asia
  { name: "Yeongyang Firefly Eco Park", chineseName: "英阳萤火虫生态公园", coordinates: [36.6667, 129.1167], bortleScale: 3.2, certification: "IDA Dark Sky Park", isDarkSkyReserve: true, radius: 35, type: 'natural' },
  { name: "Wuhu Stone Heavenly River Star Township", chineseName: "芜湖石埭天河星乡", coordinates: [31.0483, 118.2078], bortleScale: 3.8, certification: "IDA Dark Sky Park", isDarkSkyReserve: true, radius: 30, type: 'natural' },
  { name: "Yeongyang Firefly Starlight Reserve", chineseName: "英阳萤火虫星光保护区", coordinates: [36.6469, 129.0833], bortleScale: 3.0, certification: "IDA Dark Sky Reserve", isDarkSkyReserve: true, radius: 40, type: 'natural' },
  { name: "Gonjiam Astronomical Complex", chineseName: "坤甸天文综合体", coordinates: [37.3500, 127.3667], bortleScale: 4.2, certification: "Dark Sky Park", isDarkSkyReserve: true, radius: 25, type: 'natural' },
  { name: "Sobaeksan National Park", chineseName: "小白山国家公园", coordinates: [36.9500, 128.4833], bortleScale: 3.5, certification: "Dark Sky Park", isDarkSkyReserve: true, radius: 35, type: 'natural' },
  { name: "Yangmingshan National Park", chineseName: "阳明山国家公园", coordinates: [25.1667, 121.5500], bortleScale: 4.8, certification: "Urban Night Sky Place", isDarkSkyReserve: true, radius: 20, type: 'natural' },
  { name: "Ali Astronomical Observatory", chineseName: "阿里天文台", coordinates: [32.3167, 80.0167], bortleScale: 1.0, certification: "Dark Sky Sanctuary", isDarkSkyReserve: true, radius: 70, type: 'natural' },
  { name: "Yaeyama Islands Dark Sky", chineseName: "八重山群岛暗夜天空", coordinates: [24.3667, 123.7500], bortleScale: 2.5, certification: "Dark Sky Reserve", isDarkSkyReserve: true, radius: 45, type: 'natural' },
  { name: "Kozushima Island", chineseName: "神津岛", coordinates: [34.2167, 139.1500], bortleScale: 2.8, certification: "Dark Sky Island", isDarkSkyReserve: true, radius: 30, type: 'natural' },
  { name: "Tian Shan Astronomical Observatory", chineseName: "天山天文台", coordinates: [43.4783, 87.1783], bortleScale: 1.8, certification: "Dark Sky Sanctuary", isDarkSkyReserve: true, radius: 60, type: 'natural' },
];
