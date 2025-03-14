
import { LocationEntry } from "../locationDatabase";

/**
 * European and African locations with accurate Bortle scale values
 */
export const europeAfricaLocations: LocationEntry[] = [
  // European cities
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Berlin", coordinates: [52.5200, 13.4050], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Madrid", coordinates: [40.4168, -3.7038], bortleScale: 8.0, radius: 35, type: 'urban' },
  { name: "Rome", coordinates: [41.9028, 12.4964], bortleScale: 7.9, radius: 30, type: 'urban' },
  { name: "Moscow", coordinates: [55.7558, 37.6173], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "Istanbul", coordinates: [41.0082, 28.9784], bortleScale: 8.1, radius: 35, type: 'urban' },
  { name: "Stockholm", coordinates: [59.3293, 18.0686], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Athens", coordinates: [37.9838, 23.7275], bortleScale: 7.0, radius: 25, type: 'urban' },
  { name: "Reykjavik", coordinates: [64.1466, -21.9426], bortleScale: 6.8, radius: 15, type: 'urban' },
  { name: "Tromsø", coordinates: [69.6492, 18.9553], bortleScale: 5.6, radius: 15, type: 'urban' },
  { name: "Kirkenes", coordinates: [69.7269, 30.0454], bortleScale: 5.0, radius: 10, type: 'rural' },
  { name: "Longyearbyen", coordinates: [78.2232, 15.6267], bortleScale: 4.5, radius: 10, type: 'rural' },
  
  // African cities
  { name: "Cairo", coordinates: [30.0444, 31.2357], bortleScale: 8.3, radius: 40, type: 'urban' },
  { name: "Lagos", coordinates: [6.5244, 3.3792], bortleScale: 8.1, radius: 35, type: 'urban' },
  { name: "Johannesburg", coordinates: [-26.2041, 28.0473], bortleScale: 7.7, radius: 30, type: 'urban' },
  { name: "Nairobi", coordinates: [-1.2921, 36.8219], bortleScale: 7.3, radius: 25, type: 'urban' },
  { name: "Cape Town", coordinates: [-33.9249, 18.4241], bortleScale: 7.2, radius: 25, type: 'urban' },
  { name: "Casablanca", coordinates: [33.5731, -7.5898], bortleScale: 7.6, radius: 30, type: 'urban' },
  { name: "Algiers", coordinates: [36.7538, 3.0588], bortleScale: 7.5, radius: 25, type: 'urban' },
  { name: "Addis Ababa", coordinates: [9.0320, 38.7469], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Kinshasa", coordinates: [-4.4419, 15.2663], bortleScale: 7.8, radius: 30, type: 'urban' },
  
  // European natural sites
  { name: "La Palma", coordinates: [28.7136, -17.8834], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Alqueva Dark Sky Reserve", coordinates: [38.2000, -7.5000], bortleScale: 1.5, radius: 30, type: 'dark-site' },
  { name: "Brecon Beacons", coordinates: [51.8476, -3.4767], bortleScale: 3.5, radius: 20, type: 'rural' },
  { name: "Exmoor National Park", coordinates: [51.1180, -3.6427], bortleScale: 3.2, radius: 20, type: 'rural' },
  
  // African natural sites
  { name: "NamibRand", coordinates: [-24.9500, 16.0000], bortleScale: 1.0, radius: 50, type: 'dark-site' },
];
