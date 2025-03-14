
import { LocationEntry } from "../data/locationDatabase";

// Create a smaller, optimized database for quick lookups
export const quickLocationDatabase: LocationEntry[] = [
  // Major Chinese cities with accurate data
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 7, type: 'urban', radius: 30 },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 7, type: 'urban', radius: 30 },
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8, type: 'urban', radius: 30 },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8, type: 'urban', radius: 50 },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8, type: 'urban', radius: 50 },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7, type: 'urban', radius: 30 },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7, type: 'urban', radius: 30 },
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 6, type: 'urban', radius: 25 },
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7, type: 'urban', radius: 30 },
  { name: "Hangzhou", coordinates: [30.2741, 120.1552], bortleScale: 7, type: 'urban', radius: 30 },
  { name: "Tianjin", coordinates: [39.3434, 117.3616], bortleScale: 7, type: 'urban', radius: 30 },
  
  // Notable suburban areas in China (subset of the more comprehensive database)
  { name: "Songjiang District", coordinates: [31.0303, 121.2277], bortleScale: 7.1, radius: 15, type: 'suburban' },
  { name: "Jiading District", coordinates: [31.3838, 121.2642], bortleScale: 7.2, radius: 15, type: 'suburban' },
  { name: "Panyu District", coordinates: [22.9375, 113.3839], bortleScale: 7.0, radius: 15, type: 'suburban' },
  { name: "Huadu District", coordinates: [23.4037, 113.2208], bortleScale: 6.9, radius: 15, type: 'suburban' },
  { name: "Changping District", coordinates: [40.2208, 116.2312], bortleScale: 6.8, radius: 15, type: 'suburban' },
  { name: "Longquanyi District", coordinates: [30.5526, 104.2486], bortleScale: 6.4, radius: 15, type: 'suburban' },
  { name: "Xiaoshan District", coordinates: [30.1664, 120.2584], bortleScale: 6.7, radius: 15, type: 'suburban' },
  { name: "Jiangning District", coordinates: [31.9523, 118.8399], bortleScale: 6.6, radius: 15, type: 'suburban' },
  { name: "Chang'an District", coordinates: [33.9449, 108.9071], bortleScale: 6.2, radius: 15, type: 'suburban' },
  
  // Key mountain regions in China for quick access
  { name: "Huangshan Mountains", coordinates: [30.1300, 118.1650], bortleScale: 3.5, radius: 25, type: 'natural' },
  { name: "Tianshan Mountains", coordinates: [43.0000, 84.5000], bortleScale: 2.0, radius: 60, type: 'natural' },
  { name: "Qinling Mountains", coordinates: [33.9500, 108.8833], bortleScale: 3.0, radius: 40, type: 'natural' },
  { name: "Tibetan Plateau", coordinates: [31.6927, 88.7083], bortleScale: 2.0, radius: 60, type: 'natural' },
  { name: "Hengduan Mountains", coordinates: [29.2000, 100.3000], bortleScale: 2.2, radius: 45, type: 'natural' },
  { name: "Himalayan Range (China)", coordinates: [28.5000, 86.0000], bortleScale: 1.2, radius: 80, type: 'natural' },
  { name: "Greater Khingan Range", coordinates: [50.0000, 123.0000], bortleScale: 2.5, radius: 70, type: 'natural' },
  { name: "Mount Tai", coordinates: [36.2500, 117.1000], bortleScale: 4.5, radius: 15, type: 'natural' },
  { name: "Zhangjiajie National Forest Park", coordinates: [29.3167, 110.4833], bortleScale: 3.8, radius: 20, type: 'natural' },
  { name: "Jiuzhaigou Valley", coordinates: [33.2600, 103.9167], bortleScale: 3.0, radius: 25, type: 'natural' },
  
  // Smaller Chinese cities and towns
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Dongguan", coordinates: [23.0207, 113.7518], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Foshan", coordinates: [23.0229, 113.1322], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Zhengzhou", coordinates: [34.7533, 113.6653], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Xuhui District", coordinates: [31.1889, 121.4361], bortleScale: 8, type: 'urban', radius: 20 },
  { name: "Nanming District", coordinates: [26.5676, 106.7144], bortleScale: 6, type: 'urban', radius: 15 },
  { name: "Duyun", coordinates: [26.2592, 107.5113], bortleScale: 6, type: 'urban', radius: 15 },
  { name: "Guilin", coordinates: [25.2736, 110.2902], bortleScale: 6, type: 'urban', radius: 15 },
  { name: "Yangshuo", coordinates: [24.7781, 110.4960], bortleScale: 5, type: 'rural', radius: 15 },
  { name: "Lijiang", coordinates: [26.8721, 100.2281], bortleScale: 5, type: 'rural', radius: 15 },
  { name: "Dali", coordinates: [25.6064, 100.2677], bortleScale: 5, type: 'rural', radius: 15 },
  { name: "Kunming", coordinates: [25.0389, 102.7183], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Huangshan", coordinates: [29.7147, 118.3380], bortleScale: 5, type: 'rural', radius: 15 },
  
  // New Xinjiang and Central Asian cities
  { name: "Urumqi", coordinates: [43.8256, 87.6168], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Kashgar", coordinates: [39.4700, 75.9800], bortleScale: 7, type: 'urban', radius: 20 },
  { name: "Turpan", coordinates: [42.9480, 89.1849], bortleScale: 6, type: 'urban', radius: 15 },
  { name: "Almaty", coordinates: [43.2220, 76.8512], bortleScale: 7, type: 'urban', radius: 25 },
  { name: "Tashkent", coordinates: [41.2995, 69.2401], bortleScale: 7, type: 'urban', radius: 25 },
  
  // Major global cities
  { name: "New York City", coordinates: [40.7128, -74.0060], bortleScale: 8, type: 'urban', radius: 40 },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8, type: 'urban', radius: 40 },
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8, type: 'urban', radius: 40 },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 9, type: 'urban', radius: 50 },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 9, type: 'urban', radius: 40 },
  
  // Dark sky sites
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1, type: 'dark-site', radius: 60 },
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1, type: 'dark-site', radius: 50 },
  { name: "Grand Canyon", coordinates: [36.0544, -112.1401], bortleScale: 3, type: 'natural', radius: 30 },
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 3, type: 'natural', radius: 30 },
  { name: "Banff National Park", coordinates: [51.4968, -115.9281], bortleScale: 2, type: 'natural', radius: 30 },
  { name: "Australian Outback", coordinates: [-25.3450, 131.0369], bortleScale: 1, type: 'natural', radius: 100 },
  { name: "Tibetan Plateau", coordinates: [31.6927, 88.7083], bortleScale: 2, type: 'natural', radius: 60 },
  { name: "Zhangjiajie", coordinates: [29.1174, 110.4794], bortleScale: 4, type: 'natural', radius: 20 },
  { name: "Jiuzhaigou", coordinates: [33.2600, 103.9165], bortleScale: 3, type: 'natural', radius: 30 },
  { name: "Qinghai Lake", coordinates: [36.8977, 100.1802], bortleScale: 2, type: 'natural', radius: 40 },
  { name: "Dunhuang", coordinates: [40.1413, 94.6618], bortleScale: 2, type: 'natural', radius: 40 },
  { name: "Taklamakan Desert", coordinates: [38.8600, 83.5000], bortleScale: 1, type: 'natural', radius: 100 },
];

// Update spatial index to include mountain regions in China
export const spatialIndex = {
  northChina: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) && 
    (loc.type === 'urban' || loc.type === 'suburban')
  ),
  southChina: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) && 
    (loc.type === 'urban' || loc.type === 'suburban')
  ),
  centralAsia: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] > 30 && loc.coordinates[1] > 60 && loc.coordinates[1] < 95)
  ),
  mountainRegions: quickLocationDatabase.filter(loc => 
    loc.type === 'natural' && 
    (loc.name.toLowerCase().includes('mountain') || 
     loc.name.toLowerCase().includes('mountains') ||
     loc.name.toLowerCase().includes('plateau') ||
     loc.name.toLowerCase().includes('range'))
  ),
  naturalSites: quickLocationDatabase.filter(loc => 
    loc.type === 'natural' && 
    !(loc.name.toLowerCase().includes('mountain') || 
      loc.name.toLowerCase().includes('mountains') ||
      loc.name.toLowerCase().includes('plateau') ||
      loc.name.toLowerCase().includes('range'))
  ),
  northAmerica: quickLocationDatabase.filter(loc => loc.coordinates[1] < -50),
  europe: quickLocationDatabase.filter(loc => loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40),
  australasia: quickLocationDatabase.filter(loc => loc.coordinates[0] < 0 && loc.coordinates[1] > 100),
  darkSites: quickLocationDatabase.filter(loc => loc.type === 'dark-site'),
  other: quickLocationDatabase.filter(loc => 
    !((loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) || 
      (loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) ||
      (loc.coordinates[0] > 30 && loc.coordinates[1] > 60 && loc.coordinates[1] < 95) ||
      (loc.coordinates[1] < -50) ||
      (loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40) ||
      (loc.coordinates[0] < 0 && loc.coordinates[1] > 100) ||
      (loc.type === 'natural' || loc.type === 'dark-site'))
  )
};
