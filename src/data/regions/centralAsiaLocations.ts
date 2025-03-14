
import { LocationEntry } from "../locationDatabase";

/**
 * Central Asian locations with accurate Bortle scale values
 */
export const centralAsiaLocations: LocationEntry[] = [
  // Major cities in Xinjiang and Central Asia
  { name: "Urumqi", coordinates: [43.8256, 87.6168], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Kashgar", coordinates: [39.4700, 75.9800], bortleScale: 6.7, radius: 20, type: 'urban' },
  { name: "Turpan", coordinates: [42.9480, 89.1849], bortleScale: 5.8, radius: 15, type: 'urban' },
  { name: "Hami", coordinates: [42.8278, 93.5147], bortleScale: 5.5, radius: 15, type: 'urban' },
  { name: "Aksu", coordinates: [41.1637, 80.2605], bortleScale: 5.9, radius: 15, type: 'urban' },
  { name: "Korla", coordinates: [41.7268, 86.1730], bortleScale: 6.2, radius: 15, type: 'urban' },
  { name: "Hotan", coordinates: [37.1075, 79.9307], bortleScale: 5.7, radius: 15, type: 'urban' },
  
  // Central Asian cities
  { name: "Almaty", coordinates: [43.2220, 76.8512], bortleScale: 6.9, radius: 25, type: 'urban' },
  { name: "Bishkek", coordinates: [42.8746, 74.5698], bortleScale: 6.5, radius: 20, type: 'urban' },
  { name: "Tashkent", coordinates: [41.2995, 69.2401], bortleScale: 7.1, radius: 25, type: 'urban' },
  { name: "Dushanbe", coordinates: [38.5598, 68.7870], bortleScale: 6.3, radius: 20, type: 'urban' },
  { name: "Ashgabat", coordinates: [37.9601, 58.3261], bortleScale: 6.5, radius: 20, type: 'urban' },
  
  // Natural sites in Xinjiang and Central Asia
  { name: "Karakul Lake", coordinates: [38.4344, 73.3999], bortleScale: 1.9, radius: 30, type: 'natural' },
  { name: "Taklamakan Desert", coordinates: [38.8600, 83.5000], bortleScale: 1.2, radius: 100, type: 'natural' },
  { name: "Tianshan Mountains", coordinates: [43.0000, 84.0000], bortleScale: 1.7, radius: 60, type: 'natural' },
  { name: "Pamir Mountains", coordinates: [38.0000, 73.0000], bortleScale: 1.3, radius: 80, type: 'natural' },
  { name: "Issyk-Kul Lake", coordinates: [42.4168, 77.6611], bortleScale: 2.8, radius: 30, type: 'natural' },
];
