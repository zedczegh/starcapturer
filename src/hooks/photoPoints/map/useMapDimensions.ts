
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const useMapDimensions = () => {
  const isMobile = useIsMobile();
  
  const mapContainerHeight = useMemo(() => {
    return isMobile ? 'calc(50vh - 2rem)' : 'calc(70vh - 2rem)';
  }, [isMobile]);

  return {
    mapContainerHeight,
    isMobile
  };
};

