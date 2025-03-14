
import { LocationEntry } from "../locationDatabase";

/**
 * Oceania locations with accurate Bortle scale values
 */
export const oceaniaLocations: LocationEntry[] = [
  // Australian cities
  { name: "Sydney", coordinates: [-33.8688, 151.2093], bortleScale: 7.7, radius: 35, type: 'urban' },
  { name: "Melbourne", coordinates: [-37.8136, 144.9631], bortleScale: 7.6, radius: 35, type: 'urban' },
  { name: "Brisbane", coordinates: [-27.4698, 153.0251], bortleScale: 7.3, radius: 30, type: 'urban' },
  { name: "Perth", coordinates: [-31.9505, 115.8605], bortleScale: 7.2, radius: 30, type: 'urban' },
  { name: "Adelaide", coordinates: [-34.9285, 138.6007], bortleScale: 7.0, radius: 25, type: 'urban' },
  { name: "Gold Coast", coordinates: [-28.0167, 153.4000], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Canberra", coordinates: [-35.2809, 149.1300], bortleScale: 6.5, radius: 20, type: 'urban' },
  { name: "Hobart", coordinates: [-42.8821, 147.3272], bortleScale: 6.3, radius: 15, type: 'urban' },
  { name: "Alice Springs", coordinates: [-23.6980, 133.8807], bortleScale: 5.5, radius: 15, type: 'urban' },
  
  // New Zealand cities
  { name: "Auckland", coordinates: [-36.8509, 174.7645], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Wellington", coordinates: [-41.2865, 174.7762], bortleScale: 6.7, radius: 20, type: 'urban' },
  { name: "Invercargill", coordinates: [-46.4131, 168.3538], bortleScale: 5.8, radius: 15, type: 'urban' },
  
  // Oceania natural sites
  { name: "Uluru", coordinates: [-25.3444, 131.0369], bortleScale: 1.0, radius: 60, type: 'natural' },
  { name: "Australian Outback", coordinates: [-20.7359, 139.4962], bortleScale: 1.0, radius: 100, type: 'natural' },
  { name: "Aoraki Mackenzie", coordinates: [-43.9841, 170.4644], bortleScale: 1.0, radius: 45, type: 'dark-site' },
  { name: "Tekapo", coordinates: [-44.0046, 170.4831], bortleScale: 1.8, radius: 25, type: 'rural' },
  { name: "New Zealand Alps", coordinates: [-43.5321, 170.3865], bortleScale: 1.5, radius: 40, type: 'natural' },
];
