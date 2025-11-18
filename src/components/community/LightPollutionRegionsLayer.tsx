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
      console.log('LightPollutionRegionsLayer: Starting to load data...');
      setIsLoading(true);
      
      try {
        // Try to load cached data first
        let loadedRegions = loadLightPollutionRegions();
        console.log('Cached regions loaded:', loadedRegions?.length || 0);
        
        // If no cached data, initialize it
        if (!loadedRegions || loadedRegions.length === 0) {
          console.log('No cached light pollution data, initializing...');
          loadedRegions = await initializeGlobalLightPollutionData((current, total) => {
            if (current % 50 === 0) {
              console.log(`Calculating light pollution: ${current}/${total}`);
            }
          });
          console.log('Initialized regions:', loadedRegions?.length || 0);
        }
        
        setRegions(loadedRegions || []);
        console.log('Set regions state:', loadedRegions?.length || 0);
      } catch (error) {
        console.error('Error loading light pollution regions:', error);
        setRegions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!map) {
      console.log('LightPollutionRegionsLayer: No map available');
      return;
    }
    
    if (isLoading) {
      console.log('LightPollutionRegionsLayer: Still loading data...');
      return;
    }
    
    if (regions.length === 0) {
      console.log('LightPollutionRegionsLayer: No regions to display');
      return;
    }

    console.log(`LightPollutionRegionsLayer: Rendering ${regions.length} regions with opacity ${opacity}`);
    const rectangles: L.Rectangle[] = [];

    regions.forEach((region, index) => {
      try {
        const bounds: L.LatLngBoundsExpression = [
          [region.bounds.south, region.bounds.west],
          [region.bounds.north, region.bounds.east]
        ];

        const color = getBortleColor(region.bortleScale);
        const rectangle = L.rectangle(bounds, {
          color: color,
          fillColor: color,
          fillOpacity: opacity,
          weight: 1,
          opacity: 0.3,
          interactive: false
        }).addTo(map);

        rectangles.push(rectangle);
        
        if (index < 5) {
          console.log(`Region ${index}: Bortle ${region.bortleScale}, Color: ${color}, Bounds:`, bounds);
        }
      } catch (error) {
        console.error(`Error rendering region ${index}:`, error);
      }
    });

    console.log(`Successfully rendered ${rectangles.length} rectangles`);

    return () => {
      console.log('LightPollutionRegionsLayer: Cleaning up rectangles');
      rectangles.forEach(rect => {
        try {
          map.removeLayer(rect);
        } catch (error) {
          console.error('Error removing rectangle:', error);
        }
      });
    };
  }, [map, regions, opacity, isLoading]);

  return null;
};

export default LightPollutionRegionsLayer;
