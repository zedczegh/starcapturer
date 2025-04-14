
import { calculateDistance } from "@/data/locationDatabase";
import { internationalLocations } from "@/data/regions/internationalLocations";
import { chinaCityLocations } from "@/data/regions/chinaCityLocations";
import { restrictedDrivingCities } from "@/data/regions/restrictedDrivingCities";

// Enhanced location entry type with more detailed location information
export interface DetailedLocationEntry {
  name: string;
  coordinates: [number, number];
  chineseName?: string;
  village?: string;
  villageZh?: string;
  county?: string;
  countyZh?: string;
  city?: string;
  cityZh?: string;
  type?: 'city' | 'county' | 'village' | 'international';
}

// Convert our existing location data to the detailed format
export const combinedTownLocations: DetailedLocationEntry[] = [
  // Use all cities from the driving restrictions database
  ...restrictedDrivingCities.map(city => ({
    name: city.city,
    coordinates: city.coordinates,
    chineseName: city.city, // Most Chinese cities should have the same name as identifier
    city: city.city,
    cityZh: city.city,
    type: 'city' as const
  })),
  
  // Use international locations
  ...internationalLocations.map(location => ({
    name: location.name,
    coordinates: location.coordinates,
    chineseName: location.chineseName || location.name,
    city: location.name,
    cityZh: location.chineseName || location.name,
    type: 'international' as const
  })),
  
  // Use China city locations with more detailed information
  ...(Array.isArray(chinaCityLocations) ? chinaCityLocations.map(city => {
    // Try to extract county and village info from name if available
    let cityName = city.name;
    let countyName = '';
    let villageName = '';
    
    // In Chinese data, sometimes names are structured as "City, County, Village"
    const nameParts = city.name.split(',').map(part => part.trim());
    if (nameParts.length > 1) {
      cityName = nameParts[0];
      countyName = nameParts[1];
      if (nameParts.length > 2) {
        villageName = nameParts[2];
      }
    }
    
    // Same for Chinese names
    let cityNameZh = city.chineseName || city.name;
    let countyNameZh = '';
    let villageNameZh = '';
    
    if (city.chineseName) {
      const chineseNameParts = city.chineseName.split('，').map(part => part.trim());
      if (chineseNameParts.length > 1) {
        cityNameZh = chineseNameParts[0];
        countyNameZh = chineseNameParts[1];
        if (chineseNameParts.length > 2) {
          villageNameZh = chineseNameParts[2];
        }
      }
    }
    
    return {
      name: city.name,
      coordinates: city.coordinates,
      chineseName: city.chineseName || city.name,
      village: villageName || undefined,
      villageZh: villageNameZh || undefined,
      county: countyName || undefined,
      countyZh: countyNameZh || undefined,
      city: cityName,
      cityZh: cityNameZh,
      type: 'city' as const
    };
  }) : [])
];
