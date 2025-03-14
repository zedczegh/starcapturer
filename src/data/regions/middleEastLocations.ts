import { LocationEntry } from "../locationDatabase";

/**
 * Middle Eastern locations with accurate Bortle scale values
 */
export const middleEastLocations: LocationEntry[] = [
  // Major cities
  { name: "Dubai", coordinates: [25.2048, 55.2708], bortleScale: 8.3, radius: 35, type: 'urban' },
  { name: "Riyadh", coordinates: [24.7136, 46.6753], bortleScale: 8.0, radius: 40, type: 'urban' },
  { name: "Tel Aviv", coordinates: [32.0853, 34.7818], bortleScale: 7.9, radius: 30, type: 'urban' },
  { name: "Baghdad", coordinates: [33.3152, 44.3661], bortleScale: 7.7, radius: 30, type: 'urban' },
  { name: "Tehran", coordinates: [35.6892, 51.3890], bortleScale: 7.9, radius: 35, type: 'urban' },
  { name: "Doha", coordinates: [25.2854, 51.5310], bortleScale: 7.6, radius: 25, type: 'urban' },
  { name: "Abu Dhabi", coordinates: [24.4539, 54.3773], bortleScale: 7.5, radius: 25, type: 'urban' },
  
  // Other locations
  { name: "Petra", coordinates: [30.3285, 35.4444], bortleScale: 4.2, radius: 15, type: 'rural' },
  { name: "Wadi Rum", coordinates: [29.5833, 35.4167], bortleScale: 2.0, radius: 30, type: 'natural' },
  { name: "Negev Desert", coordinates: [30.8333, 34.7833], bortleScale: 2.5, radius: 40, type: 'natural' },
];
