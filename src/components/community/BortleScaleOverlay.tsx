import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getBortleColor, getBortleOpacity } from '@/utils/bortleScaleColors';

interface BortleScaleOverlayProps {
  locations: SharedAstroSpot[];
  opacity: number;
}

const BortleScaleOverlay: React.FC<BortleScaleOverlayProps> = ({ locations, opacity }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    // Create circles for each location based on their Bortle scale
    const circles: L.Circle[] = [];

    locations.forEach((spot) => {
      if (spot.latitude && spot.longitude && spot.bortleScale) {
        const color = getBortleColor(spot.bortleScale);
        const baseOpacity = getBortleOpacity(spot.bortleScale);
        
        // Create a larger circle to represent the light pollution zone
        const circle = L.circle([spot.latitude, spot.longitude], {
          radius: 80000, // 80km radius for better visibility
          fillColor: color,
          fillOpacity: baseOpacity * opacity,
          color: color,
          opacity: 0.4 * opacity,
          weight: 2,
        });

        circle.addTo(map);
        circles.push(circle);
      }
    });

    // Cleanup function
    return () => {
      circles.forEach(circle => {
        map.removeLayer(circle);
      });
    };
  }, [map, locations, opacity]);

  return null;
};

export default BortleScaleOverlay;
