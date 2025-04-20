
import { SiqsResult, SiqsCalculationOptions } from '../siqsTypes';
import { Location, LocationGroup, groupNearbyLocations } from '../utils/locationGrouping';
import { calculateRealTimeSiqs } from '../siqsCalculator';

export async function batchCalculateSiqs(
  locations: Location[],
  options: SiqsCalculationOptions = {}
): Promise<{[key: string]: SiqsResult}> {
  const { maxConcurrent = 3 } = options;
  const results: {[key: string]: SiqsResult} = {};
  
  if (locations.length === 0) return results;
  
  const locationGroups = groupNearbyLocations(locations);
  console.log(`Grouped ${locations.length} locations into ${locationGroups.length} batches for SIQS calculation`);
  
  for (let i = 0; i < locationGroups.length; i += maxConcurrent) {
    const batch = locationGroups.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (group) => {
      const representative = group.representative;
      const representativeSiqs = await calculateRealTimeSiqs(
        representative.latitude,
        representative.longitude,
        representative.bortleScale,
        options
      );
      
      group.locations.forEach(location => {
        const locationKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
        const variation = location === representative ? 0 : (Math.random() * 0.4 - 0.2);
        
        results[locationKey] = {
          ...representativeSiqs,
          siqs: Math.max(0, Math.min(10, representativeSiqs.siqs + variation))
        };
      });
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
}
