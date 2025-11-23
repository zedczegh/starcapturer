import React from 'react';
import { useMapProvider } from '@/contexts/MapProviderContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import CommunityMap from '@/components/community/CommunityMap';
import AMapCommunity from './amap/AMapCommunity';

interface UnifiedCommunityMapProps {
  center: [number, number];
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
  isMobile?: boolean;
  zoom?: number;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const UnifiedCommunityMap: React.FC<UnifiedCommunityMapProps> = (props) => {
  const { provider, isAMapReady } = useMapProvider();

  if (provider === 'amap' && isAMapReady) {
    return <AMapCommunity {...props} />;
  }

  return <CommunityMap {...props} />;
};

export default UnifiedCommunityMap;
