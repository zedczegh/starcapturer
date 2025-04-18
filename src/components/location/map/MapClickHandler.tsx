
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

/**
 * Component to handle map click events
 * This component doesn't render anything but adds click event handling to the map
 */
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onClick }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onClick]);

  return null;
};

export default MapClickHandler;
