import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { 
  LightPollutionRegion, 
  getBortleColor,
  loadLightPollutionRegions,
  initializeGlobalLightPollutionData 
} from "@/services/globalLightPollutionService";

interface LightPollutionRegionsLayerProps {
  opacity?: number;
}

const LightPollutionRegionsLayer: React.FC<LightPollutionRegionsLayerProps> = ({ 
  opacity = 0.4 
}) => {
  const map = useMap();
  const [regions, setRegions] = useState<LightPollutionRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Try to load cached data first
      let loadedRegions = loadLightPollutionRegions();
      
      // If no cached data, initialize it
      if (!loadedRegions || loadedRegions.length === 0) {
        console.log('No cached light pollution data, initializing...');
        loadedRegions = await initializeGlobalLightPollutionData((current, total) => {
          console.log(`Calculating light pollution: ${current}/${total}`);
        });
      }
      
      setRegions(loadedRegions || []);
      setIsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!map || regions.length === 0 || isLoading) return;

    const rectangles: L.Rectangle[] = [];

    regions.forEach((region) => {
      const bounds: L.LatLngBoundsExpression = [
        [region.bounds.south, region.bounds.west],
        [region.bounds.north, region.bounds.east]
      ];

      const rectangle = L.rectangle(bounds, {
        color: getBortleColor(region.bortleScale),
        fillColor: getBortleColor(region.bortleScale),
        fillOpacity: opacity,
        weight: 0,
        interactive: false
      }).addTo(map);

      rectangles.push(rectangle);
    });

    return () => {
      rectangles.forEach(rect => map.removeLayer(rect));
    };
  }, [map, regions, opacity, isLoading]);

  return null;
};

export default LightPollutionRegionsLayer;
