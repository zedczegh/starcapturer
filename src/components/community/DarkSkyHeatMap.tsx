import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface DarkSkyHeatMapProps {
  locations: Array<{
    latitude: number;
    longitude: number;
    bortleScale?: number | null;
    siqs?: number | null;
  }>;
  intensity?: number;
}

const DarkSkyHeatMap: React.FC<DarkSkyHeatMapProps> = ({ 
  locations, 
  intensity = 0.5 
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !locations || locations.length === 0) {
      console.log("DarkSkyHeatMap: Skipping render - no map or locations");
      return;
    }

    // Convert locations to heat map points [lat, lng, intensity]
    const heatPoints = locations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => {
        // Calculate intensity based on Bortle scale (lower is better) and SIQS (higher is better)
        let weight = 0.5; // default
        
        if (loc.bortleScale !== null && loc.bortleScale !== undefined) {
          // Bortle scale 1-3 is excellent, 4-5 is good, 6+ is poor
          weight = Math.max(0.1, (10 - loc.bortleScale) / 10);
        } else if (loc.siqs !== null && loc.siqs !== undefined) {
          // SIQS typically 0-10, higher is better
          weight = Math.min(1, loc.siqs / 10);
        }
        
        return [loc.latitude, loc.longitude, weight] as [number, number, number];
      });

    // Create heat layer with error handling
    try {
      const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.0: '#1a0033',
        0.2: '#2d1b4e',
        0.4: '#4a3f7a',
        0.6: '#6b5fa7',
        0.8: '#9d8fd9',
        1.0: '#d4c5f9'
      }
    }).addTo(map);

      // Set opacity
      heatLayer.setOptions({ minOpacity: intensity * 0.3, maxOpacity: intensity });

      return () => {
        if (map && heatLayer) {
          map.removeLayer(heatLayer);
        }
      };
    } catch (error) {
      console.error("Error creating heat layer:", error);
    }
  }, [map, locations, intensity]);

  return null;
};

export default DarkSkyHeatMap;
