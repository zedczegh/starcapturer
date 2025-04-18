
import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

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
  const locationsToShow = useMemo(() => {
    if (activeView === 'certified') {
      return certifiedLocations;
    } else {
      return calculatedLocations.concat(
        certifiedLocations.filter(certLoc => 
          !calculatedLocations.some(calcLoc => 
            calcLoc.latitude === certLoc.latitude && 
            calcLoc.longitude === certLoc.longitude
          )
        )
      );
    }
  }, [activeView, certifiedLocations, calculatedLocations]);

  const optimizedLocations = useMemo(() => {
    if (!locationsToShow || locationsToShow.length === 0) {
      return [];
    }

    if (!isMobile) {
      return locationsToShow;
    }
    
    if (locationsToShow.length <= 30) {
      return locationsToShow;
    }
    
    const certified = locationsToShow.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const nonCertifiedSamplingRate = activeView === 'certified' ? 5 : 3;
    
    const nonCertified = locationsToShow
      .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
      .filter((_, index) => index % nonCertifiedSamplingRate === 0)
      .slice(0, 40);
    
    return [...certified, ...nonCertified];
  }, [locationsToShow, isMobile, activeView]);

  return { optimizedLocations };
};
