
import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { filterLocations, optimizeLocationsForMobile } from '@/utils/locationFilterUtils';

interface UseLocationFilteringProps {
  activeView: 'certified' | 'calculated';
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  isMobile: boolean;
}

export const useLocationFiltering = ({
  activeView,
  certifiedLocations,
  calculatedLocations,
  isMobile
}: UseLocationFilteringProps) => {
  const locationsToShow = useMemo(() => 
    filterLocations(activeView, certifiedLocations, calculatedLocations),
    [activeView, certifiedLocations, calculatedLocations]
  );

  const optimizedLocations = useMemo(() => 
    optimizeLocationsForMobile(locationsToShow, isMobile, activeView),
    [locationsToShow, isMobile, activeView]
  );

  return { optimizedLocations };
};
