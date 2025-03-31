
import { LocationEntry } from "../locationDatabase";

/**
 * International Dark Sky Places
 * Data sourced from International Dark-Sky Association (IDA)
 * https://www.darksky.org/our-work/conservation/idsp/
 */
export const darkSkyLocations: LocationEntry[] = [
  // North America - Dark Sky Parks
  { name: "Grand Canyon National Park", coordinates: [36.1070, -112.1130], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Death Valley National Park", coordinates: [36.5323, -116.9325], bortleScale: 1, radius: 60, type: 'dark-site' },
  { name: "Big Bend National Park", coordinates: [29.2498, -103.2502], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Natural Bridges National Monument", coordinates: [37.6013, -109.9753], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Cherry Springs State Park", coordinates: [41.6626, -77.8169], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Copper Breaks State Park", coordinates: [34.1147, -99.7505], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Enchanted Rock State Natural Area", coordinates: [30.5055, -98.8177], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Clayton Lake State Park", coordinates: [36.5605, -103.3194], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Headlands International Dark Sky Park", coordinates: [45.7768, -84.9001], bortleScale: 1, radius: 20, type: 'dark-site' },
  { name: "Kissimmee Prairie Preserve State Park", coordinates: [27.6125, -81.0492], bortleScale: 1, radius: 25, type: 'dark-site' },
  
  // North America - Dark Sky Reserves
  { name: "Mont-Mégantic International Dark Sky Reserve", coordinates: [45.4565, -71.1523], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Central Idaho Dark Sky Reserve", coordinates: [43.8427, -114.5549], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Boundary Waters Canoe Area Wilderness", coordinates: [47.9501, -91.4151], bortleScale: 1, radius: 50, type: 'dark-site' },
  
  // North America - Dark Sky Sanctuaries
  { name: "Cosmic Campground", coordinates: [33.4674, -108.9212], bortleScale: 1, radius: 20, type: 'dark-site' },
  { name: "Rainbow Bridge National Monument", coordinates: [37.0777, -110.9635], bortleScale: 1, radius: 20, type: 'dark-site' },
  { name: "Devils River State Natural Area", coordinates: [29.8917, -100.9957], bortleScale: 1, radius: 25, type: 'dark-site' },
  
  // Europe - Dark Sky Parks & Reserves
  { name: "Galloway Forest Park", coordinates: [55.1100, -4.4800], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Exmoor National Park", coordinates: [51.1180, -3.6427], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Northumberland National Park", coordinates: [55.2857, -2.2288], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Brecon Beacons National Park", coordinates: [51.8787, -3.3712], bortleScale: 1.5, radius: 25, type: 'dark-site' },
  { name: "Westhavelland International Dark Sky Reserve", coordinates: [52.7167, 12.3133], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Alqueva Dark Sky Reserve", coordinates: [38.2000, -7.5000], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Kerry International Dark Sky Reserve", coordinates: [51.9419, -10.1478], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Pic du Midi International Dark Sky Reserve", coordinates: [42.9361, 0.1428], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Cévennes National Park", coordinates: [44.3298, 3.6023], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Elan Valley Estate Dark Sky Park", coordinates: [52.2651, -3.5769], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Bodmin Moor Dark Sky Landscape", coordinates: [50.5174, -4.6242], bortleScale: 1.5, radius: 25, type: 'dark-site' },
  
  // Europe - Dark Sky Communities
  { name: "Flagstaff, Arizona", coordinates: [35.1983, -111.6513], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Dripping Springs, Texas", coordinates: [30.1903, -98.0867], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Beverly Shores, Indiana", coordinates: [41.6875, -87.0031], bortleScale: 3, radius: 10, type: 'dark-site' },
  { name: "Horseshoe Bay, Texas", coordinates: [30.5419, -98.3633], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Torrey, Utah", coordinates: [38.2997, -111.4194], bortleScale: 2, radius: 15, type: 'dark-site' },
  
  // Africa & Middle East
  { name: "NamibRand Nature Reserve", coordinates: [-25.0000, 16.0000], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Sahara Desert", coordinates: [27.1262, 13.1394], bortleScale: 1, radius: 70, type: 'dark-site' },
  { name: "Ramon Crater", coordinates: [30.6167, 34.8000], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Aoraki Mackenzie International Dark Sky Reserve", coordinates: [-43.9800, 170.4600], bortleScale: 1, radius: 40, type: 'dark-site' },
  
  // Asia & Pacific
  { name: "Yeongyang Firefly Eco Park", coordinates: [36.6700, 129.1100], bortleScale: 1, radius: 20, type: 'dark-site' },
  { name: "Warrumbungle National Park", coordinates: [-31.2733, 149.0158], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Great Barrier Island", coordinates: [-36.2503, 175.4717], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Tekapo (Aoraki Mackenzie)", coordinates: [-44.0046, 170.4831], bortleScale: 1, radius: 40, type: 'dark-site' },
  
  // Australia & New Zealand
  { name: "River Murray Dark Sky Reserve", coordinates: [-34.2667, 139.6000], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Winton Wetlands", coordinates: [-36.3434, 146.0953], bortleScale: 1.5, radius: 25, type: 'dark-site' },
  { name: "Wiruna, Australia", coordinates: [-33.1621, 150.1799], bortleScale: 1, radius: 30, type: 'dark-site' },
  
  // China & Eastern Asia
  { name: "Wuyishan National Park", coordinates: [27.6562, 117.9685], bortleScale: 1.5, radius: 30, type: 'dark-site' },
  { name: "Ngari Night Sky Park (Tibet)", coordinates: [32.5000, 80.0000], bortleScale: 1, radius: 80, type: 'dark-site' },
  { name: "Qinghai Lake", coordinates: [36.8300, 100.1950], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Mount Nianbaoyuze", coordinates: [33.8200, 102.2700], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Alxa Desert Populus Forest Starry Sky Park", coordinates: [39.4300, 105.6700], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Arxan National Geopark", coordinates: [47.1784, 119.9432], bortleScale: 1, radius: 30, type: 'dark-site' },
  
  // South America
  { name: "El Leoncito National Park", coordinates: [-31.8000, -69.3000], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Cerro Tololo Inter-American Observatory", coordinates: [-30.1653, -70.8048], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Atacama Desert", coordinates: [-24.5000, -69.2500], bortleScale: 1, radius: 80, type: 'dark-site' },
  { name: "Valle del Elqui", coordinates: [-29.9553, -70.7844], bortleScale: 1, radius: 40, type: 'dark-site' },
  
  // More International Dark Sky Sanctuaries
  { name: "Gabriela Mistral Dark Sky Sanctuary", coordinates: [-30.2092, -70.9981], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Pitcairn Islands", coordinates: [-25.0668, -130.1002], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Stewart Island/Rakiura", coordinates: [-46.9991, 168.0833], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Massacre Rim", coordinates: [41.5868, -119.8526], bortleScale: 1, radius: 40, type: 'dark-site' },
  
  // Additional certified Urban Night Sky Places
  { name: "Fountain Hills, Arizona", coordinates: [33.6044, -111.7242], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Lakewood Ranch, Florida", coordinates: [27.3977, -82.4455], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Camp Oakes", coordinates: [34.1780, -116.8963], bortleScale: 2, radius: 15, type: 'dark-site' },
  
  // Lesser known but still certified Dark Sky places
  { name: "Tumacácori National Historical Park", coordinates: [31.5717, -111.0429], bortleScale: 2, radius: 20, type: 'dark-site' },
  { name: "Oracle State Park", coordinates: [32.6100, -110.7700], bortleScale: 2, radius: 20, type: 'dark-site' },
  { name: "Kartchner Caverns State Park", coordinates: [31.8383, -110.3479], bortleScale: 2, radius: 20, type: 'dark-site' },
  { name: "Middle Fork River Forest Preserve", coordinates: [40.3456, -88.1731], bortleScale: 2, radius: 15, type: 'dark-site' },
];
