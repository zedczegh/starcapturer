
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { filterValidLocations, separateLocationTypes } from '@/utils/locationFiltering';
import { filterWaterLocations } from './locationFilters';

/**
 * Process locations for display on the map
 */
export const processLocations = async (
  allLocations: SharedAstroSpot[],
  activeView: 'certified' | 'calculated'
): Promise<SharedAstroSpot[]> => {
  try {
    // Filter valid locations
    const validLocations = filterValidLocations(allLocations);
    
    // Separate locations by type
    const { certifiedLocations, calculatedLocations } = separateLocationTypes(validLocations);
    console.log(`Location counts - certified: ${certifiedLocations.length}, calculated: ${calculatedLocations.length}, total: ${validLocations.length}`);
    
    // Apply water filtering using reverse geocoding for calculated locations
    const nonWaterCalculatedLocations = await filterWaterLocations(calculatedLocations);
    
    console.log(`Filtered out ${calculatedLocations.length - nonWaterCalculatedLocations.length} water locations`);
    
    // Determine which locations to show based on view
    if (activeView === 'certified') {
      // In certified view, only show certified locations
      return certifiedLocations as SharedAstroSpot[];
    } else {
      // For calculated view, include both calculated and certified locations
      return [...nonWaterCalculatedLocations, ...certifiedLocations] as SharedAstroSpot[];
    }
  } catch (error) {
    console.error('Error processing map locations:', error);
    return [];
  }
};
