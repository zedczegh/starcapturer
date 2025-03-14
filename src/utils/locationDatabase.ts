
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
];

// Create a spatial index for faster lookups - precomputed distance buckets
export const spatialIndex = {
  northChina: quickLocationDatabase.filter(loc => loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130),
  southChina: quickLocationDatabase.filter(loc => loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130),
  northAmerica: quickLocationDatabase.filter(loc => loc.coordinates[1] < -50),
  europe: quickLocationDatabase.filter(loc => loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40),
  australasia: quickLocationDatabase.filter(loc => loc.coordinates[0] < 0 && loc.coordinates[1] > 100),
  other: quickLocationDatabase.filter(loc => 
    !((loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) || 
      (loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) ||
      (loc.coordinates[1] < -50) ||
      (loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40) ||
      (loc.coordinates[0] < 0 && loc.coordinates[1] > 100))
  )
};
