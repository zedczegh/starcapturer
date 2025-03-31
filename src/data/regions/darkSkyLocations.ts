
import { LocationEntry } from "../locationDatabase";

/**
 * International Dark Sky Places
 * Data sourced from International Dark-Sky Association (IDA)
 * https://www.darksky.org/our-work/conservation/idsp/
 */
export const darkSkyLocations: LocationEntry[] = [
  // North America
  { name: "Grand Canyon National Park", coordinates: [36.1070, -112.1130], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Death Valley National Park", coordinates: [36.5323, -116.9325], bortleScale: 1.0, radius: 60, type: 'dark-site' },
  { name: "Big Bend National Park", coordinates: [29.2498, -103.2502], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Natural Bridges National Monument", coordinates: [37.6013, -109.9753], bortleScale: 1.0, radius: 30, type: 'dark-site' },
  { name: "Cherry Springs State Park", coordinates: [41.6626, -77.8169], bortleScale: 1.0, radius: 25, type: 'dark-site' },
  { name: "Mont-Mégantic", coordinates: [45.4565, -71.1523], bortleScale: 1.0, radius: 30, type: 'dark-site' },
  
  // Europe
  { name: "Galloway Forest Park", coordinates: [55.1100, -4.4800], bortleScale: 1.0, radius: 35, type: 'dark-site' },
  { name: "Exmoor National Park", coordinates: [51.1180, -3.6427], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Northumberland National Park", coordinates: [55.2857, -2.2288], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Brecon Beacons National Park", coordinates: [51.8787, -3.3712], bortleScale: 1.5, radius: 25, type: 'dark-site' },
  { name: "Westhavelland International Dark Sky Reserve", coordinates: [52.7167, 12.3133], bortleScale: 1.0, radius: 40, type: 'dark-site' },
  { name: "Alqueva Dark Sky Reserve", coordinates: [38.2000, -7.5000], bortleScale: 1.0, radius: 40, type: 'dark-site' },
  { name: "Kerry International Dark Sky Reserve", coordinates: [51.9419, -10.1478], bortleScale: 1.0, radius: 35, type: 'dark-site' },
  { name: "Pic du Midi", coordinates: [42.9361, 0.1428], bortleScale: 1.0, radius: 30, type: 'dark-site' },
  
  // Africa & Middle East
  { name: "NamibRand Nature Reserve", coordinates: [-25.0000, 16.0000], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Sahara Desert", coordinates: [27.1262, 13.1394], bortleScale: 1.0, radius: 70, type: 'dark-site' },
  { name: "Ramon Crater", coordinates: [30.6167, 34.8000], bortleScale: 1.0, radius: 25, type: 'dark-site' },
  
  // Asia & Pacific
  { name: "Yeongyang Firefly Eco Park", coordinates: [36.6700, 129.1100], bortleScale: 1.0, radius: 20, type: 'dark-site' },
  { name: "Warrumbungle National Park", coordinates: [-31.2733, 149.0158], bortleScale: 1.0, radius: 35, type: 'dark-site' },
  { name: "Aoraki Mackenzie", coordinates: [-43.9800, 170.4600], bortleScale: 1.0, radius: 40, type: 'dark-site' },
  { name: "Great Barrier Island", coordinates: [-36.2503, 175.4717], bortleScale: 1.0, radius: 30, type: 'dark-site' },
  
  // China
  { name: "Wuyishan National Park", coordinates: [27.6562, 117.9685], bortleScale: 1.5, radius: 30, type: 'dark-site' },
  { name: "Ngari Prefecture", coordinates: [32.5000, 80.0000], bortleScale: 1.0, radius: 80, type: 'dark-site' },
  { name: "Qinghai Lake", coordinates: [36.8300, 100.1950], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Mount Nianbaoyuze", coordinates: [33.8200, 102.2700], bortleScale: 1.0, radius: 40, type: 'dark-site' },
  { name: "Alxa Desert Populus Forest Starry Sky Park", coordinates: [39.4300, 105.6700], bortleScale: 1.0, radius: 35, type: 'dark-site' },
  
  // South America
  { name: "El Leoncito National Park", coordinates: [-31.8000, -69.3000], bortleScale: 1.0, radius: 40, type: 'dark-site' },
  { name: "Cerro Tololo", coordinates: [-30.1653, -70.8048], bortleScale: 1.0, radius: 35, type: 'dark-site' },
  { name: "Atacama Desert", coordinates: [-24.5000, -69.2500], bortleScale: 1.0, radius: 80, type: 'dark-site' },
];
