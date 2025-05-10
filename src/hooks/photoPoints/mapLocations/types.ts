
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export interface UseMapLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
}

export interface LocationMapState {
  processedLocations: SharedAstroSpot[];
}
