
import { areLocationsNearby } from '../cache/siqsCache';

export interface Location {
  latitude: number;
  longitude: number;
  bortleScale: number;
}

export interface LocationGroup {
  representative: Location;
  locations: Location[];
}

export function groupNearbyLocations(
  locations: Location[],
  proximityThresholdKm: number = 5
): LocationGroup[] {
  const groups: LocationGroup[] = [];
  const unprocessed = [...locations];
  
  while (unprocessed.length > 0) {
    const representative = unprocessed.shift()!;
    const group = {
      representative,
      locations: [representative]
    };
    
    let i = 0;
    while (i < unprocessed.length) {
      const location = unprocessed[i];
      
      if (areLocationsNearby(
        representative.latitude,
        representative.longitude,
        location.latitude,
        location.longitude,
        proximityThresholdKm
      )) {
        group.locations.push(location);
        unprocessed.splice(i, 1);
      } else {
        i++;
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}
