
import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

/**
 * Component to handle map click events
 * This component doesn't render anything but adds click event handling to the map
 */
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onClick }) => {
  const map = useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });

  return null;
};

export default MapClickHandler;
