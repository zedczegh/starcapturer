
import { fetchDarkSkyPlaces, convertToLocationEntries } from './darkSkyFetcher';
import { darkSkyLocations } from '@/data/regions/darkSkyLocations';

/**
 * Check for missing dark sky locations
 * Compares our database with the IDA API
 */
export async function checkMissingDarkSkyLocations(): Promise<{
  missingLocations: any[];
  existingLocations: any[];
  missingCount: number;
  totalFromApi: number;
}> {
  // Fetch latest data from API
  console.log('Fetching dark sky places from IDA API...');
  const apiPlaces = await fetchDarkSkyPlaces();
  console.log(`Found ${apiPlaces.length} places from the IDA API`);
  
  // Convert to our format for comparison
  const apiLocations = convertToLocationEntries(apiPlaces);
  
  // Create maps for quick lookup
  const existingLocationsMap = new Map();
  darkSkyLocations.forEach(location => {
    // Use coordinates as unique identifier
    const key = `${location.coordinates[0].toFixed(4)},${location.coordinates[1].toFixed(4)}`;
    existingLocationsMap.set(key, location);
  });
  
  // Find missing locations
  const missingLocations = [];
  const existingLocations = [];
  
  for (const apiLocation of apiLocations) {
    const key = `${apiLocation.coordinates[0].toFixed(4)},${apiLocation.coordinates[1].toFixed(4)}`;
    
    // If we already have this location by coordinates
    if (existingLocationsMap.has(key)) {
      existingLocations.push({
        api: apiLocation,
        existing: existingLocationsMap.get(key)
      });
      continue;
    }
    
    // Check for similar names (to catch locations with slightly different coordinates)
    let found = false;
    for (const existingLocation of darkSkyLocations) {
      const apiName = apiLocation.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingName = existingLocation.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (apiName.includes(existingName) || existingName.includes(apiName)) {
        found = true;
        existingLocations.push({
          api: apiLocation,
          existing: existingLocation,
          nameMatchOnly: true
        });
        break;
      }
    }
    
    if (!found) {
      missingLocations.push(apiLocation);
    }
  }
  
  console.log(`Found ${missingLocations.length} missing locations`);
  console.log(`Found ${existingLocations.length} existing locations`);
  
  return {
    missingLocations,
    existingLocations,
    missingCount: missingLocations.length,
    totalFromApi: apiLocations.length
  };
}

/**
 * Get data suitable for adding to darkSkyLocations.ts
 * Format the missing locations as TypeScript code ready for insertion
 */
export async function getMissingLocationsCode(): Promise<string> {
  const { missingLocations } = await checkMissingDarkSkyLocations();
  
  if (missingLocations.length === 0) {
    return '// No missing locations found';
  }
  
  let code = '// Missing dark sky locations to add to darkSkyLocations.ts\n';
  code += 'const newLocations: (LocationEntry & { chineseName?: string })[] = [\n';
  
  for (const location of missingLocations) {
    code += `  { 
    name: "${location.name}", 
    chineseName: "${location.chineseName}",
    coordinates: [${location.coordinates[0]}, ${location.coordinates[1]}], 
    bortleScale: ${location.bortleScale}, 
    radius: ${location.radius}, 
    type: '${location.type}',
    certification: '${location.certification || 'Dark Sky Location'}'
  },\n`;
  }
  
  code += '];\n';
  return code;
}
