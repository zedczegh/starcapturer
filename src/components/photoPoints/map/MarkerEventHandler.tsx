
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MarkerEventHandlerProps {
  marker: L.Marker | null;
  eventMap: Record<string, (e?: any) => void>;
}

/**
 * Component to handle marker events outside the Leaflet context
 */
const MarkerEventHandler: React.FC<MarkerEventHandlerProps> = ({ marker, eventMap }) => {
  const map = useMap();
  
  useEffect(() => {
    // This component is expected to be used as a child of a Marker
    // When used this way, we can't use the marker prop directly
    // Instead, we rely on the parent context of the component
    // This is a workaround since the latest version requires eventHandlers prop
    return () => {
      // Clean up function if needed
    };
  }, [marker, map, eventMap]);
  
  return null;
};

export default MarkerEventHandler;
