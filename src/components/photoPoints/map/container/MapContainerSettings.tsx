
import React from 'react';
import 'leaflet/dist/leaflet.css';
import '../MarkerStyles.css';
import '../MapStyles.css';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';

// Configure leaflet to handle marker paths
configureLeaflet();

/**
 * Component for map container settings and initialization
 * Enhanced with mobile-specific configurations
 */
const MapContainerSettings: React.FC = () => {
  // Apply global Leaflet mobile settings
  React.useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && window.L) {
      // Adjust Leaflet's tap tolerance for better mobile interaction
      if (window.L.Map.mergeOptions) {
        window.L.Map.mergeOptions({
          tap: true,
          tapTolerance: 15, // Increased from default 15 to improve touch detection
          bounceAtZoomLimits: false, // Prevent bounce for smoother experience
          inertia: true,
          inertiaDeceleration: 2000, // Lower value for faster deceleration
          touchZoom: 'center' // More predictable zooming behavior
        });
      }
      
      // Add mobile-specific CSS fixes
      if (!document.getElementById('leaflet-mobile-fixes')) {
        const style = document.createElement('style');
        style.id = 'leaflet-mobile-fixes';
        style.textContent = `
          .leaflet-container {
            touch-action: none !important; 
          }
          .leaflet-marker-icon {
            transform-origin: bottom center !important;
          }
          .leaflet-touch .leaflet-control-zoom a {
            width: 36px !important;
            height: 36px !important;
            line-height: 36px !important;
            font-size: 18px !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    return () => {
      // Clean up mobile CSS fixes on unmount
      const styleElement = document.getElementById('leaflet-mobile-fixes');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  
  // This component doesn't render anything visible but ensures
  // that all necessary styles and configurations are loaded
  return null;
};

export default MapContainerSettings;
