
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// This component helps fix specific mobile map rendering issues
const MobileMapFixer = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Fix for mobile Safari rendering issues
    const fixMobileRendering = () => {
      try {
        const containerElement = map.getContainer();
        if (containerElement) {
          // Force reflow
          containerElement.style.display = 'none';
          // Read offsetHeight to force layout recalculation
          const _ = containerElement.offsetHeight;
          containerElement.style.display = '';
        }
        map.invalidateSize();
      } catch (error) {
        console.error("Error in MobileMapFixer:", error);
      }
    };
    
    // Apply fix after a short delay
    const timeoutId = setTimeout(fixMobileRendering, 500);
    
    return () => clearTimeout(timeoutId);
  }, [map]);

  return null;
};

export default MobileMapFixer;
