
import L from 'leaflet';

/**
 * Enhanced map marker utilities with mobile optimizations
 */

// Configure Leaflet to fix common issues with icon paths and mobile performance
export const configureLeaflet = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Fix icon path issues in bundled environments
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch (error) {
    console.error('Error configuring Leaflet:', error);
  }
};

// Get optimized tile layer options based on device type
export const getTileLayerOptions = (isMobile: boolean = false) => {
  const baseOptions = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 18,
    minZoom: 2
  };
  
  if (isMobile) {
    return {
      ...baseOptions,
      maxZoom: 16, // Reduced max zoom for better mobile performance
      tileSize: 256, // Standard tile size for mobile
      zoomOffset: 0,
      detectRetina: true,
      updateWhenIdle: true, // Only update tiles when map is idle
      updateWhenZooming: false, // Don't update while zooming for smoother experience
      keepBuffer: 1 // Smaller buffer on mobile to save memory
    };
  }
  
  return {
    ...baseOptions,
    tileSize: 256,
    zoomOffset: 0,
    detectRetina: true,
    keepBuffer: 2 // Larger buffer on desktop for smoother panning
  };
};

// Get fast tile layer for better performance
export const getFastTileLayer = () => {
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };
};

// Create optimized marker icons with mobile considerations
export const createOptimizedMarker = (
  color: string = '#f43f5e',
  isMobile: boolean = false
): L.DivIcon | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Slightly larger markers on mobile for better touch targets
    const size = isMobile ? 28 : 24;
    const anchorOffset = isMobile ? 14 : 12;
    
    const markerHtmlStyles = `
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      display: block;
      position: relative;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      ${isMobile ? 'touch-action: manipulation;' : ''}
    `;

    // Reduced animation intensity on mobile to improve performance
    const pulseStyles = isMobile ? '' : `
      content: '';
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      background-color: ${color};
      position: absolute;
      margin: -2px 0 0 -2px;
      animation: pulse 2s infinite;
      opacity: 0.4;
      box-shadow: 0 0 3px ${color};
      
      @keyframes pulse {
        0% {
          transform: scale(0.6);
          opacity: 0;
        }
        50% {
          opacity: 0.4;
        }
        100% {
          transform: scale(1.3);
          opacity: 0;
        }
      }
    `;

    const icon = L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [anchorOffset, size],
      popupAnchor: [0, -size],
      html: `<span style="${markerHtmlStyles}">
               ${!isMobile ? `<span style="${pulseStyles}"></span>` : ''}
             </span>`,
      iconSize: [size, size]
    });

    return icon;
  } catch (error) {
    console.error("Error creating optimized marker:", error);
    return new L.Icon.Default();
  }
};

// Alias for backward compatibility
export const createCustomMarker = (color: string = '#f43f5e', shape: string = 'teardrop', scale: number = 1.0): L.DivIcon | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const size = 24 * scale;
    const anchorOffset = 12 * scale;
    
    const markerHtmlStyles = `
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      display: block;
      position: relative;
      border-radius: ${shape === 'circle' ? '50%' : '50% 50% 50% 0'};
      transform: ${shape === 'circle' ? 'none' : 'rotate(-45deg)'};
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    const icon = L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [anchorOffset, size],
      popupAnchor: [0, -size],
      html: `<span style="${markerHtmlStyles}"></span>`,
      iconSize: [size, size]
    });

    return icon;
  } catch (error) {
    console.error("Error creating custom marker:", error);
    return new L.Icon.Default();
  }
};

// Initialize Leaflet configuration
if (typeof window !== 'undefined') {
  configureLeaflet();
}
