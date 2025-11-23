import React from 'react';
import { useMapProvider } from '@/contexts/MapProviderContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LazyMapContainer from '@/components/photoPoints/map/LazyMapContainer';
import AMapContainer from './amap/AMapContainer';

interface UnifiedMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
}

const UnifiedMapContainer: React.FC<UnifiedMapContainerProps> = (props) => {
  const { provider, isAMapReady } = useMapProvider();

  if (provider === 'amap' && isAMapReady) {
    return <AMapContainer {...props} />;
  }

  return <LazyMapContainer {...props} />;
};

export default UnifiedMapContainer;
