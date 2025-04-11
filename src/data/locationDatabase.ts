
/**
 * Interface for location entries in the database
 */
export interface LocationEntry {
  name: string;
  chineseName?: string; // Added the chineseName property
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number;
  type?: 'urban' | 'suburban' | 'rural' | 'natural' | 'dark-site';
  certification?: string;
  isDarkSkyReserve?: boolean;
}
