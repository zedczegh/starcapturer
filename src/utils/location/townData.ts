
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
  province?: string;
  provinceZh?: string;
  type?: 'city' | 'county' | 'village' | 'province' | 'international';
  population?: number; // For better prioritization of significant places
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
    type: 'city' as const,
    population: 1000000 // Default large population for major cities
  })),
  
  // Use international locations
  ...internationalLocations.map(location => ({
    name: location.name,
    coordinates: location.coordinates,
    chineseName: location.chineseName || location.name,
    city: location.name,
    cityZh: location.chineseName || location.name,
    type: 'international' as const,
    population: 500000 // Default medium population for international locations
  })),
  
  // Use China city locations with more detailed information
  ...(Array.isArray(chinaCityLocations) ? chinaCityLocations.map(city => {
    // Try to extract county and village info from name if available
    let cityName = city.name;
    let countyName = '';
    let villageName = '';
    let provinceName = '';
    
    // In Chinese data, sometimes names are structured as "City, County, Village"
    const nameParts = city.name.split(',').map(part => part.trim());
    if (nameParts.length > 1) {
      cityName = nameParts[0];
      countyName = nameParts[1];
      if (nameParts.length > 2) {
        villageName = nameParts[2];
      }
      // Extract province if available as part of the name
      if (nameParts.some(part => part.includes('Province'))) {
        provinceName = nameParts.find(part => part.includes('Province')) || '';
      }
    }
    
    // Same for Chinese names
    let cityNameZh = city.chineseName || city.name;
    let countyNameZh = '';
    let villageNameZh = '';
    let provinceNameZh = '';
    
    if (city.chineseName) {
      const chineseNameParts = city.chineseName.split('，').map(part => part.trim());
      if (chineseNameParts.length > 1) {
        cityNameZh = chineseNameParts[0];
        countyNameZh = chineseNameParts[1];
        if (chineseNameParts.length > 2) {
          villageNameZh = chineseNameParts[2];
        }
        // Extract Chinese province if available
        if (chineseNameParts.some(part => part.includes('省') || part.includes('自治区'))) {
          provinceNameZh = chineseNameParts.find(part => 
            part.includes('省') || part.includes('自治区')
          ) || '';
        }
      }
    }
    
    // Determine location type based on available information
    let locationType: 'city' | 'county' | 'village' = 'city';
    if (villageName) locationType = 'village';
    else if (countyName) locationType = 'county';
    
    // Estimate population based on location type
    let estimatedPopulation = 500000; // Default for city
    if (locationType === 'village') estimatedPopulation = 10000;
    else if (locationType === 'county') estimatedPopulation = 100000;
    
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
      province: provinceName || undefined,
      provinceZh: provinceNameZh || undefined,
      type: locationType,
      population: estimatedPopulation
    };
  }) : []),
  
  // Add special region entries for major Chinese provinces to improve regional detection
  {
    name: "Tibet",
    coordinates: [29.6500, 91.1000],
    chineseName: "西藏",
    province: "Tibet",
    provinceZh: "西藏自治区",
    city: "Lhasa",
    cityZh: "拉萨",
    type: "province",
    population: 3000000
  },
  {
    name: "Xinjiang",
    coordinates: [43.8000, 87.6000],
    chineseName: "新疆",
    province: "Xinjiang",
    provinceZh: "新疆维吾尔自治区",
    city: "Urumqi",
    cityZh: "乌鲁木齐",
    type: "province",
    population: 25000000
  },
  {
    name: "Inner Mongolia",
    coordinates: [40.8180, 111.6700],
    chineseName: "内蒙古",
    province: "Inner Mongolia",
    provinceZh: "内蒙古自治区",
    city: "Hohhot",
    cityZh: "呼和浩特",
    type: "province",
    population: 24000000
  },
  {
    name: "Qinghai",
    coordinates: [36.6200, 101.7700],
    chineseName: "青海",
    province: "Qinghai",
    provinceZh: "青海省",
    city: "Xining",
    cityZh: "西宁",
    type: "province",
    population: 6000000
  }
];
