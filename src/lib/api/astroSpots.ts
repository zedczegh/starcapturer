import { calculateDistance } from '@/data/utils/distanceCalculator';

/**
 * Interface for shared astronomy spots
 */
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  bortleScale: number;
  date: string;
  userId?: string;
  username?: string;
  likes?: number;
  distance?: number;
  siqs?: number;
  photoUrl?: string;
  photographer?: string;
  targets?: string[];
  isViable?: boolean;
  timestamp: string;
  chineseName?: string;
  isDarkSkyReserve?: boolean; // Flag for certified dark sky locations
  certification?: string;     // Type of certification (e.g., "IDA Gold Tier")
}

/**
 * Shares an astronomy spot to the database
 */
export async function shareAstroSpot(spotData: Omit<SharedAstroSpot, 'id' | 'date'>): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Currently using a mock function until we have a real backend
    console.log('Sharing astro spot:', spotData);
    
    // Mock success response
    return {
      success: true,
      id: Date.now().toString(),
      message: 'Location shared successfully!'
    };
  } catch (error) {
    console.error('Error sharing astro spot:', error);
    return {
      success: false,
      message: 'Failed to share location. Please try again.'
    };
  }
}

/**
 * Gets real locations within the search radius around the given coordinates
 * These are sampling points across various geographic locations
 */
export async function getSharedAstroSpots(
  latitude: number,
  longitude: number,
  limit = 50,
  radius = 100  // km
): Promise<SharedAstroSpot[]> {
  try {
    // Regular astronomy spots (keeping existing data)
    const realLocations = [
      // Dark sky preserves and astronomy spots in various regions
      { name: "Zhangbei Grassland Observatory", latitude: 41.1582, longitude: 114.7022, bortleScale: 3 },
      { name: "Wudalianchi Dark Sky Park", latitude: 48.7205, longitude: 126.1987, bortleScale: 2 },
      { name: "Nagchu Highland", latitude: 31.4769, longitude: 92.0510, bortleScale: 1 },
      { name: "Arxan Dark Sky", latitude: 47.1893, longitude: 120.4103, bortleScale: 2 },
      { name: "Qilian Mountains", latitude: 38.1917, longitude: 99.7953, bortleScale: 2 },
      { name: "Kanas Lake Viewpoint", latitude: 48.7303, longitude: 87.0244, bortleScale: 1 },
      { name: "Changbai Mountain", latitude: 41.9806, longitude: 128.0854, bortleScale: 3 },
      { name: "Dunhuang Desert", latitude: 40.1425, longitude: 94.6617, bortleScale: 1 },
      { name: "Ngari Observatory", latitude: 32.3157, longitude: 80.0701, bortleScale: 1 },
      { name: "Qinghai Lake Viewing Point", latitude: 36.8257, longitude: 100.1893, bortleScale: 2 },
      { name: "Lugu Lake Hills", latitude: 27.7048, longitude: 100.7985, bortleScale: 3 },
      { name: "Jade Dragon Mountain", latitude: 27.1014, longitude: 100.1772, bortleScale: 2 },
      { name: "Xishuangbanna Tropical Sky", latitude: 22.0112, longitude: 100.7927, bortleScale: 3 },
      { name: "Altay Mountains", latitude: 47.8456, longitude: 88.1427, bortleScale: 1 },
      { name: "Namtso Lake", latitude: 30.7081, longitude: 90.5516, bortleScale: 1 },
      // Add low to mid-elevation locations
      { name: "Wuyuan Rural Viewpoint", latitude: 29.2483, longitude: 117.8614, bortleScale: 4 },
      { name: "Lushan Mountain", latitude: 29.5657, longitude: 115.9875, bortleScale: 3 },
      { name: "Xinglong Observatory", latitude: 40.3958, longitude: 117.5777, bortleScale: 3 },
      { name: "Mount Emei", latitude: 29.5249, longitude: 103.3323, bortleScale: 3 },
      { name: "Zhangjiajie Heights", latitude: 29.1324, longitude: 110.4793, bortleScale: 3 },
      { name: "Yellow Mountain", latitude: 30.1314, longitude: 118.1631, bortleScale: 3 },
      { name: "Daocheng Yading", latitude: 29.0254, longitude: 100.3035, bortleScale: 2 },
      { name: "Mount Tai", latitude: 36.2610, longitude: 117.1097, bortleScale: 4 },
      // Additional locations with varying bortle scales
      { name: "Taihu Lake Observatory", latitude: 31.1897, longitude: 120.1390, bortleScale: 5 },
      { name: "Hainan Tropical Island", latitude: 19.2097, longitude: 109.7540, bortleScale: 4 },
      { name: "Xisha Islands", latitude: 16.8338, longitude: 112.3377, bortleScale: 2 },
      { name: "Dinghu Mountain", latitude: 23.1723, longitude: 112.5511, bortleScale: 4 },
      { name: "Wuyi Mountains", latitude: 27.7559, longitude: 117.6746, bortleScale: 3 },
      { name: "Dahinggan Mountains", latitude: 50.2434, longitude: 124.1954, bortleScale: 2 },
      { name: "Western Desert View", latitude: 39.4547, longitude: 75.9792, bortleScale: 1 },
      { name: "Inner Mongolia Grassland", latitude: 44.0833, longitude: 113.9427, bortleScale: 2 },
      { name: "Lhasa Mountains", latitude: 29.6500, longitude: 91.1000, bortleScale: 3 },
      { name: "Yamdrok Lake", latitude: 29.3620, longitude: 90.9722, bortleScale: 2 },
      { name: "Mount Kailash", latitude: 31.0793, longitude: 81.3119, bortleScale: 1 },
      { name: "Taklamakan Desert Edge", latitude: 40.2018, longitude: 83.5498, bortleScale: 1 },
      { name: "Taklimakan Desert", latitude: 38.8604, longitude: 83.4784, bortleScale: 1 },
      { name: "Daxing'anling Forest", latitude: 51.6731, longitude: 124.3336, bortleScale: 2 },
      { name: "Guilin Hills", latitude: 25.2736, longitude: 110.2900, bortleScale: 4 },
      { name: "Yading Nature Reserve", latitude: 28.4845, longitude: 100.3327, bortleScale: 2 },
      { name: "Nujiang Canyon", latitude: 27.7300, longitude: 98.8500, bortleScale: 3 },
      { name: "Xiata Forest Viewpoint", latitude: 43.5998, longitude: 85.6143, bortleScale: 2 },
      // International locations for users traveling
      { name: "Mauna Kea", latitude: 19.8208, longitude: -155.4680, bortleScale: 1 },
      { name: "Atacama Desert", latitude: -23.4500, longitude: -68.2000, bortleScale: 1 },
      { name: "Namibian Desert", latitude: -24.7270, longitude: 15.3350, bortleScale: 1 },
      { name: "Australian Outback", latitude: -25.3444, longitude: 131.0369, bortleScale: 1 },
      { name: "Death Valley", latitude: 36.5323, longitude: -116.9325, bortleScale: 2 },
      { name: "La Palma Observatory", latitude: 28.7636, longitude: -17.8947, bortleScale: 2 },
      { name: "Pic du Midi", latitude: 42.9372, longitude: 0.1419, bortleScale: 2 },
      { name: "NamibRand Dark Sky Reserve", latitude: -25.0400, longitude: 16.0200, bortleScale: 1 },
      { name: "Aoraki Mackenzie", latitude: -43.7340, longitude: 170.0966, bortleScale: 1 },
      { name: "Cherry Springs State Park", latitude: 41.6626, longitude: -77.8223, bortleScale: 2 }
    ];
    
    // Official DarkSky International certified locations
    const darkSkyReserves = [
      // Asia Pacific certified dark sky locations
      { name: "Yaeyama Islands Dark Sky Park", latitude: 24.3874, longitude: 124.1539, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Yeongyang Firefly Eco Park", latitude: 36.8272, longitude: 129.1750, bortleScale: 2, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Warrumbungle Dark Sky", latitude: -31.2742, longitude: 149.0192, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Great Barrier Island", latitude: -36.2507, longitude: 175.4631, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Sanctuary" },
      { name: "Lake Tekapo Reserve", latitude: -43.8867, longitude: 170.5166, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Gold Tier Reserve" },
      
      // Europe certified dark sky locations
      { name: "Alqueva Dark Sky Reserve", latitude: 38.2000, longitude: -7.4333, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Reserve" },
      { name: "Westhavelland Nature Park", latitude: 52.6962, longitude: 12.3749, bortleScale: 2, isDarkSkyReserve: true, certification: "IDA Dark Sky Reserve" },
      { name: "Exmoor National Park", latitude: 51.1187, longitude: -3.6531, bortleScale: 2, isDarkSkyReserve: true, certification: "IDA Dark Sky Reserve" },
      { name: "Galloway Forest Park", latitude: 55.1146, longitude: -4.6733, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Gold Tier Park" },
      { name: "Moore's Reserve, Kielder", latitude: 55.2007, longitude: -2.5843, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Gold Tier Park" },
      { name: "Kerry Dark Sky Reserve", latitude: 51.9433, longitude: -10.2694, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Gold Tier Reserve" },
      { name: "Mont-Mégantic", latitude: 45.4547, longitude: -71.1529, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Reserve" },
      
      // North America certified dark sky locations
      { name: "Flagstaff Dark Sky Community", latitude: 35.1981, longitude: -111.6510, bortleScale: 3, isDarkSkyReserve: true, certification: "IDA Dark Sky Community" },
      { name: "Grand Canyon National Park", latitude: 36.1069, longitude: -112.1129, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Death Valley National Park", latitude: 36.5054, longitude: -117.0794, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Joshua Tree National Park", latitude: 33.8734, longitude: -115.9010, bortleScale: 2, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Big Bend National Park", latitude: 29.2498, longitude: -103.2502, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Gold Tier Park" },
      { name: "Natural Bridges Monument", latitude: 37.6213, longitude: -109.9767, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      { name: "Cherry Springs State Park", latitude: 41.6611, longitude: -77.8170, bortleScale: 2, isDarkSkyReserve: true, certification: "IDA Gold Tier Park" },
      
      // South America certified dark sky locations
      { name: "AURA Observatory Chile", latitude: -30.1679, longitude: -70.8047, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Sanctuary" },
      { name: "El Leoncito Park", latitude: -31.7997, longitude: -69.2949, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Park" },
      
      // Africa certified dark sky locations
      { name: "NamibRand Nature Reserve", latitude: -25.0333, longitude: 16.0000, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Gold Tier Reserve" },
      { name: "Winklhoek Farm", latitude: -32.3776, longitude: 20.9031, bortleScale: 1, isDarkSkyReserve: true, certification: "IDA Dark Sky Reserve" }
    ];
    
    // Merge all locations
    const allLocations = [...realLocations, ...darkSkyReserves];
    
    // Chinese location names for language support
    const chineseNames: Record<string, string> = {
      "Zhangbei Grassland Observatory": "张北草原天文台",
      "Wudalianchi Dark Sky Park": "五大连池暗夜公园",
      "Nagchu Highland": "那曲高原",
      "Arxan Dark Sky": "阿尔山暗夜",
      "Qilian Mountains": "祁连山",
      "Kanas Lake Viewpoint": "喀纳斯湖观景点",
      "Changbai Mountain": "长白山",
      "Dunhuang Desert": "敦煌沙漠",
      "Ngari Observatory": "阿里天文台",
      "Qinghai Lake Viewing Point": "青海湖观景点",
      "Lugu Lake Hills": "泸沽湖山丘",
      "Jade Dragon Mountain": "玉龙雪山",
      "Xishuangbanna Tropical Sky": "西双版纳热带星空",
      "Altay Mountains": "阿尔泰山",
      "Namtso Lake": "纳木错湖",
      "Wuyuan Rural Viewpoint": "婺源乡村观景点",
      "Lushan Mountain": "庐山",
      "Xinglong Observatory": "兴隆天文台",
      "Mount Emei": "峨眉山",
      "Zhangjiajie Heights": "张家界高处",
      "Yellow Mountain": "黄山",
      "Daocheng Yading": "稻城亚丁",
      "Mount Tai": "泰山",
      "Taihu Lake Observatory": "太湖���文台",
      "Hainan Tropical Island": "海南热带岛屿",
      "Xisha Islands": "西沙群岛",
      "Dinghu Mountain": "鼎湖山",
      "Wuyi Mountains": "武夷山",
      "Dahinggan Mountains": "大兴安岭",
      "Western Desert View": "西部沙漠景观",
      "Inner Mongolia Grassland": "内蒙古草原",
      "Lhasa Mountains": "拉萨山脉",
      "Yamdrok Lake": "羊卓雍措",
      "Mount Kailash": "冈仁波齐山",
      "Taklamakan Desert Edge": "塔克拉玛干沙漠边缘",
      "Taklimakan Desert": "塔克拉玛干沙漠",
      "Daxing'anling Forest": "大兴安岭森林",
      "Guilin Hills": "桂林山丘",
      "Yading Nature Reserve": "亚丁自然保护区",
      "Nujiang Canyon": "怒江峡谷",
      "Xiata Forest Viewpoint": "夏塔森林观景点",
      "Mauna Kea": "莫纳克亚山",
      "Atacama Desert": "阿塔卡马沙漠",
      "Namibian Desert": "纳米比亚沙漠",
      "Australian Outback": "澳大利亚内陆",
      "Death Valley": "死亡谷",
      "La Palma Observatory": "拉帕尔马天文台",
      "Pic du Midi": "米迪峰",
      "NamibRand Dark Sky Reserve": "纳米布兰德暗夜保护区",
      "Aoraki Mackenzie": "奥拉基麦肯齐",
      "Cherry Springs State Park": "樱泉州立公园",
      "Yaeyama Islands Dark Sky Park": "八重山群岛暗夜公园",
      "Yeongyang Firefly Eco Park": "英阳萤火虫生态公园",
      "Warrumbungle Dark Sky": "沃伦邦格尔暗夜公园",
      "Great Barrier Island": "大屏障岛暗夜保护区",
      "Lake Tekapo Reserve": "蒂卡波湖暗夜保护区",
      "Alqueva Dark Sky Reserve": "阿尔克瓦暗夜保护区",
      "Westhavelland Nature Park": "西哈维尔兰自然公园",
      "Exmoor National Park": "埃克斯穆尔国家公园",
      "Galloway Forest Park": "盖洛韦森林公园",
      "Moore's Reserve, Kielder": "基尔德摩尔保护区",
      "Kerry Dark Sky Reserve": "克里暗夜保护区",
      "Mont-Mégantic": "梅甘蒂克山保护区",
      "Flagstaff Dark Sky Community": "旗杆镇暗夜社区",
      "Grand Canyon National Park": "大峡谷国家公园",
      "Death Valley National Park": "死亡谷国家公园",
      "Joshua Tree National Park": "约书亚树国家公园",
      "Big Bend National Park": "大弯国家公园",
      "Natural Bridges Monument": "自然桥纪念碑",
      "Cherry Springs State Park": "樱泉州立公园",
      "AURA Observatory Chile": "智利奥拉天文台",
      "El Leoncito Park": "小狮子公园",
      "NamibRand Nature Reserve": "纳米布兰德自然保护区",
      "Winklhoek Farm": "温克尔胡克农场"
    };
    
    // Calculate distance for each location and filter by radius
    const locationsWithDistance = allLocations.map(location => {
      const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
      return {
        ...location,
        id: `loc-${location.latitude}-${location.longitude}`, // Generate deterministic ID
        description: location.isDarkSkyReserve 
          ? `Certified dark sky location with ${location.certification} status. Bortle scale: ${location.bortleScale}.` 
          : `Astronomical observation location with Bortle ${location.bortleScale}`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(), // Add the required timestamp
        distance,
        chineseName: chineseNames[location.name] || location.name
      };
    });
    
    // Filter by distance and sort by closest
    return locationsWithDistance
      .filter(location => location.distance !== undefined && location.distance <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching shared spots:', error);
    return [];
  }
}

/**
 * Gets recommended photo spots for a location
 */
export async function getRecommendedPhotoPoints(
  latitude: number,
  longitude: number,
  limit = 5
): Promise<SharedAstroSpot[]> {
  // For now, this is similar to getSharedAstroSpots but with a smaller limit
  return getSharedAstroSpots(latitude, longitude, limit);
}

/**
 * Generates a URL for directions to a location
 */
export function generateBaiduMapsUrl(latitude: number, longitude: number, name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://api.map.baidu.com/direction?origin=latlng:${latitude},${longitude}|name:Current&destination=name:${encodedName}&mode=driving&coord_type=wgs84&output=html`;
}
