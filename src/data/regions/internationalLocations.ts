
import { LocationEntry } from "../locationDatabase";

/**
 * International locations with accurate Bortle scale values
 * Data sourced from 天气预报查询_国际城市_39474站.xlsx
 */
export const internationalLocations: LocationEntry[] = [
  // North America
  { name: "New York", coordinates: [40.7128, -74.0060], bortleScale: 8.5, radius: 50, type: 'urban' },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "Chicago", coordinates: [41.8781, -87.6298], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Toronto", coordinates: [43.6532, -79.3832], bortleScale: 7.3, radius: 30, type: 'urban' },
  { name: "Mexico City", coordinates: [19.4326, -99.1332], bortleScale: 8.6, radius: 45, type: 'urban' },
  
  // Europe
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Berlin", coordinates: [52.5200, 13.4050], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Madrid", coordinates: [40.4168, -3.7038], bortleScale: 8.0, radius: 35, type: 'urban' },
  { name: "Rome", coordinates: [41.9028, 12.4964], bortleScale: 7.9, radius: 30, type: 'urban' },
  
  // Asia (non-China)
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 8.9, radius: 55, type: 'urban' },
  { name: "Seoul", coordinates: [37.5665, 126.9780], bortleScale: 8.6, radius: 45, type: 'urban' },
  { name: "Singapore", coordinates: [1.3521, 103.8198], bortleScale: 8.5, radius: 30, type: 'urban' },
  { name: "Mumbai", coordinates: [19.0760, 72.8777], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "Bangkok", coordinates: [13.7563, 100.5018], bortleScale: 8.4, radius: 40, type: 'urban' },
  
  // Oceania
  { name: "Sydney", coordinates: [-33.8688, 151.2093], bortleScale: 7.7, radius: 35, type: 'urban' },
  { name: "Melbourne", coordinates: [-37.8136, 144.9631], bortleScale: 7.6, radius: 35, type: 'urban' },
  { name: "Auckland", coordinates: [-36.8509, 174.7645], bortleScale: 7.1, radius: 25, type: 'urban' },
  
  // Africa
  { name: "Cairo", coordinates: [30.0444, 31.2357], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Lagos", coordinates: [6.5244, 3.3792], bortleScale: 8.1, radius: 35, type: 'urban' },
  { name: "Johannesburg", coordinates: [-26.2041, 28.0473], bortleScale: 7.7, radius: 30, type: 'urban' },
  
  // South America
  { name: "São Paulo", coordinates: [-23.5505, -46.6333], bortleScale: 8.3, radius: 45, type: 'urban' },
  { name: "Buenos Aires", coordinates: [-34.6037, -58.3816], bortleScale: 8.1, radius: 40, type: 'urban' },
  { name: "Rio de Janeiro", coordinates: [-22.9068, -43.1729], bortleScale: 7.9, radius: 40, type: 'urban' },
  
  // Prime dark-sky locations
  { name: "La Palma", coordinates: [28.7136, -17.8834], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "NamibRand", coordinates: [-24.9500, 16.0000], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1.0, radius: 60, type: 'dark-site' },
  { name: "Aoraki Mackenzie", coordinates: [-43.9841, 170.4644], bortleScale: 1.0, radius: 45, type: 'dark-site' },
  { name: "Natural Bridges", coordinates: [37.6014, -109.9753], bortleScale: 1.2, radius: 30, type: 'dark-site' },
];
