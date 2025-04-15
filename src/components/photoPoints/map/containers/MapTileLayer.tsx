
import React from 'react';
import { TileLayer } from 'react-leaflet';
import { getTileLayerOptions } from '@/components/location/map/MapMarkerUtils';

interface MapTileLayerProps {
  isMobile: boolean;
}

const MapTileLayer: React.FC<MapTileLayerProps> = ({ isMobile }) => {
  const tileOptions = getTileLayerOptions(Boolean(isMobile));
  
  return (
    <TileLayer
      attribution={tileOptions.attribution}
      url={tileOptions.url}
      maxZoom={isMobile ? tileOptions.maxZoom - 2 : tileOptions.maxZoom}
    />
  );
};

export default MapTileLayer;
