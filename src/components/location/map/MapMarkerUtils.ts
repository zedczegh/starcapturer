
import L from 'leaflet';

/**
 * Configure Leaflet to fix common issues with icon paths and mobile performance
 */
export const configureLeaflet = () => {
  // Fix icon path issues in bundled environments
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  
  // Configure performance optimizations when running on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    // Disable animations for better performance on mobile
    L.DomUtil.TRANSITION = L.DomUtil.TRANSITION ? L.DomUtil.TRANSITION : '';
    L.DomUtil.TRANSFORM = L.DomUtil.TRANSFORM ? L.DomUtil.TRANSFORM : '';
    
    // Set max bounds to prevent excessive panning
    L.Map.prototype.options.maxBounds = [[-90, -180], [90, 180]];
    L.Map.prototype.options.maxBoundsViscosity = 1.0;
    
    // Optimize mobile rendering
    L.Map.prototype.options.preferCanvas = true;
    L.Map.prototype.options.renderer = L.canvas();
  }
  
  // Optimize tile loading globally
  L.TileLayer.prototype.options.updateWhenIdle = true;
  L.TileLayer.prototype.options.updateWhenZooming = false;
  L.TileLayer.prototype.options.updateInterval = 150;
  
  // Reduce tile load requests when moving
  L.GridLayer.prototype.options.keepBuffer = isMobile ? 1 : 2;
};

/**
 * Create a custom marker icon for the map with improved mobile performance
 */
export function createCustomMarker(
  color: string = '#4ADE80',
  shape: 'circle' | 'star' = 'circle',
  sizeMultiplier: number = 1.0
): L.DivIcon | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const baseSize = 24 * sizeMultiplier;
    let html = '';
    
    // Apply hardware acceleration and optimize rendering
    const styleOptimizations = 'will-change: transform; transform: translateZ(0); backface-visibility: hidden;';
    
    if (shape === 'star') {
      // Star shape with optimized rendering
      html = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="${baseSize}" height="${baseSize}" 
             viewBox="0 0 24 24" 
             style="${styleOptimizations}"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
                   fill="${color}" 
                   stroke="#FFFFFF" 
                   stroke-width="1" 
                   stroke-linejoin="round"
          />
        </svg>
      `;
    } else {
      // Circle shape with optimized rendering
      html = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="${baseSize}" height="${baseSize}" 
             viewBox="0 0 24 24"
             style="${styleOptimizations}"
        >
          <circle cx="12" cy="12" r="10" 
                  fill="${color}" 
                  stroke="#FFFFFF" 
                  stroke-width="1"
          />
        </svg>
      `;
    }

    return L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [baseSize/2, baseSize/2],
      popupAnchor: [0, -baseSize/2],
      html: html,
      iconSize: [baseSize, baseSize]
    });
  } catch (error) {
    console.error("Error creating custom marker:", error);
    return new L.Icon.Default();
  }
}

// Configure Leaflet immediately on client-side
if (typeof window !== 'undefined') {
  configureLeaflet();
}

/**
 * Format geo coordinates to a readable string
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};

/**
 * Get a faster tile URL by using a CDN and adjusting attribution
 * @returns Optimized tile URL and attribution
 */
export const getFastTileLayer = (): {url: string, attribution: string} => {
  // Use a faster tile server with better worldwide distribution
  const fastTileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  
  return { url: fastTileUrl, attribution };
};
