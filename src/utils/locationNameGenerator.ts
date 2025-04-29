
/**
 * Utility for generating location names based on coordinates
 */

import { randomFromArray } from './random';

// Arrays of adjectives and location types for name generation
const locationAdjectives = [
  'Hidden', 'Quiet', 'Serene', 'Dark', 'Starry', 'Clear', 'Remote', 
  'Pristine', 'Elevated', 'Silent', 'Peaceful', 'Tranquil', 'Secluded',
  'Open', 'Vast', 'Expansive', 'Quiet', 'Ideal', 'Perfect'
];

const locationTypes = [
  'Point', 'Vista', 'Overlook', 'Ridge', 'Hill', 'Plateau', 'Field', 
  'Clearing', 'Valley', 'Viewpoint', 'Meadow', 'Spot', 'Outpost',
  'Observation Point', 'Site', 'Area', 'Location'
];

/**
 * Generate a name for a location based on coordinates
 * Uses latitude and longitude to seed the name generation
 */
export function generateLocationName(latitude: number, longitude: number): string {
  // Use coordinates to create a deterministic but varied name
  const coordSum = Math.abs(latitude + longitude);
  const coordProduct = Math.abs(latitude * longitude);
  
  // Use the coordinate values to select adjectives and location type
  const adjIndex = Math.floor(coordSum * 100) % locationAdjectives.length;
  const typeIndex = Math.floor(coordProduct * 100) % locationTypes.length;
  
  const adjective = locationAdjectives[adjIndex];
  const locationType = locationTypes[typeIndex];
  
  // For some variety, sometimes add the rounded coordinates to the name
  if (coordSum % 3 === 0) {
    const lat = Math.abs(latitude).toFixed(1);
    const lng = Math.abs(longitude).toFixed(1);
    return `${adjective} ${locationType} (${lat},${lng})`;
  }
  
  return `${adjective} ${locationType}`;
}

/**
 * Generate a random location name (for use when coordinates aren't available)
 */
export function generateRandomLocationName(): string {
  const adjective = randomFromArray(locationAdjectives);
  const locationType = randomFromArray(locationTypes);
  
  return `${adjective} ${locationType}`;
}
