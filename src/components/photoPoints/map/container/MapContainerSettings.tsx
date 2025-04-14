
import React from 'react';
import 'leaflet/dist/leaflet.css';
import '../MarkerStyles.css';
import '../MapStyles.css';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';

// Configure leaflet to handle marker paths
configureLeaflet();

/**
 * Component for map container settings and initialization
 */
const MapContainerSettings: React.FC = () => {
  // This component doesn't render anything visible but ensures
  // that all necessary styles and configurations are loaded
  return null;
};

export default MapContainerSettings;
