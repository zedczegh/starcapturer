
import { calculateDistance } from '@/utils/geoUtils';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';

export const filterCalculatedLocations = (
  calculatedLocations: SharedAstroSpot[],
  effectiveLocation: { latitude: number; longitude: number } | null,
  searchRadius: number
): SharedAstroSpot[] => {
  if (!effectiveLocation) return calculatedLocations;
  
  return calculatedLocations.filter(loc => {
    const distance = loc.distance || calculateDistance(
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    return distance <= searchRadius;
  });
};

export const useFilteredLocations = (
  locations: SharedAstroSpot[],
  effectiveLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
) => {
  const {
    certifiedLocations,
    calculatedLocations,
  } = useCertifiedLocations(locations);
  
  const filteredCalculatedLocations = filterCalculatedLocations(
    calculatedLocations,
    effectiveLocation,
    searchRadius
  );
  
  return {
    certifiedLocations,
    calculatedLocations,
    filteredCalculatedLocations,
    locationsToShow: activeView === 'certified' ? certifiedLocations : filteredCalculatedLocations
  };
};
