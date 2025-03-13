
import { locationDatabase } from "@/utils/locationUtils";
import { Location } from "@/components/MapSelector";

// Common well-known locations for fallback
const commonLocations: Location[] = [
  { name: "Beijing", placeDetails: "Beijing, China", latitude: 39.9042, longitude: 116.4074 },
  { name: "Shanghai", placeDetails: "Shanghai, China", latitude: 31.2304, longitude: 121.4737 },
  { name: "Hong Kong", placeDetails: "Hong Kong SAR", latitude: 22.3193, longitude: 114.1694 },
  { name: "Guangzhou", placeDetails: "Guangdong, China", latitude: 23.1291, longitude: 113.2644 },
  { name: "Shenzhen", placeDetails: "Guangdong, China", latitude: 22.5431, longitude: 114.0579 },
  { name: "Chengdu", placeDetails: "Sichuan, China", latitude: 30.5728, longitude: 104.0668 },
  { name: "Zhangjiajie", placeDetails: "Hunan, China", latitude: 29.1174, longitude: 110.4794 },
  { name: "Xi'an", placeDetails: "Shaanxi, China", latitude: 34.3416, longitude: 108.9398 },
  { name: "Lhasa", placeDetails: "Tibet, China", latitude: 29.6500, longitude: 91.1000 },
  { name: "Urumqi", placeDetails: "Xinjiang, China", latitude: 43.8256, longitude: 87.6168 },
  { name: "Harbin", placeDetails: "Heilongjiang, China", latitude: 45.8038, longitude: 126.5340 }
];

/**
 * Search for locations based on a query string
 */
export async function searchLocations(query: string): Promise<Location[]> {
  const lowercaseQuery = query.toLowerCase();
  
  // First search our database of locations
  const matchingLocations = locationDatabase
    .filter(location => 
      location.name.toLowerCase().includes(lowercaseQuery)
    )
    .map(location => ({
      name: location.name,
      placeDetails: `${location.name}, Bortle Scale: ${location.bortleScale.toFixed(1)}`,
      latitude: location.coordinates[0],
      longitude: location.coordinates[1]
    }));
  
  if (matchingLocations.length >= 3) {
    return matchingLocations.slice(0, 8);
  }
  
  // If we don't have enough matches, add common locations
  const filteredCommonLocations = commonLocations.filter(location => 
    location.name.toLowerCase().includes(lowercaseQuery) && 
    !matchingLocations.some(match => match.name === location.name)
  );
  
  const combinedResults = [...matchingLocations, ...filteredCommonLocations];
  if (combinedResults.length >= 3) {
    return combinedResults.slice(0, 8);
  }
  
  // If we still don't have enough, create a generic location
  if (combinedResults.length < 3) {
    const generatedLocation: Location = {
      name: query,
      placeDetails: `Searched location: ${query}`,
      latitude: 30 + Math.random() * 20,
      longitude: 100 + Math.random() * 20
    };
    
    return [...combinedResults, generatedLocation].slice(0, 8);
  }
  
  return combinedResults.slice(0, 8);
}
