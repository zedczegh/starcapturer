
import { LocationEntry } from "../locationDatabase";

/**
 * Polar and extreme locations with accurate Bortle scale values
 */
export const polarLocations: LocationEntry[] = [
  // Antarctic locations
  { name: "Antarctica", coordinates: [77.8750, -166.0528], bortleScale: 1.0, radius: 200, type: 'dark-site' },
  { name: "South Pole", coordinates: [-90.0000, 0.0000], bortleScale: 1.0, radius: 200, type: 'dark-site' },
  
  // Arctic locations
  { name: "North Pole", coordinates: [90.0000, 0.0000], bortleScale: 1.0, radius: 200, type: 'dark-site' },
  { name: "Svalbard", coordinates: [78.2232, 15.6267], bortleScale: 3.0, radius: 50, type: 'rural' },
  { name: "Greenland Ice Sheet", coordinates: [72.5796, -38.4592], bortleScale: 1.0, radius: 150, type: 'dark-site' },
  { name: "Alert, Canada", coordinates: [82.5018, -62.3481], bortleScale: 1.0, radius: 100, type: 'dark-site' },
];
