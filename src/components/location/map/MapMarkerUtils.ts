
import L from 'leaflet';

/**
 * Configure Leaflet with proper icon paths
 * This is necessary because Leaflet's default icon paths are different in a bundled environment
 */
export function configureLeaflet() {
  // Delete default icon settings to avoid path issues
  if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
    delete L.Icon.Default.prototype._getIconUrl;
    
    // Configure with CDN paths for markers
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }
}

/**
 * Create a custom marker icon with specified color and shape
 * @param color - CSS color string
 * @param shape - Shape of the marker: 'circle', 'star', or 'user'
 * @returns Leaflet DivIcon
 */
export function createCustomMarker(color: string, shape: 'circle' | 'star' | 'user' = 'circle'): L.DivIcon {
  // SVG code for different shapes
  let svgPath = '';
  let viewBox = '0 0 24 24';
  let className = 'custom-marker';
  
  // Use more vibrant colors for better visibility
  let markerColor = color;
  
  switch (shape) {
    case 'star':
      // Star shape for certified locations
      markerColor = '#FFD700'; // Golden yellow for certified locations
      svgPath = `
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
          fill="${markerColor}" 
          stroke="white" 
          stroke-width="1.5"
        />
        <circle cx="12" cy="12" r="12" fill="${markerColor}" stroke="none" opacity="0.2" class="pulse-circle" />
      `;
      className += ' star-marker';
      break;
    
    case 'user':
      // User location marker - blue dot with pulse effect
      markerColor = '#3b82f6'; // Blue for user location
      svgPath = `
        <circle cx="12" cy="12" r="8" fill="${markerColor}" stroke="white" stroke-width="2" opacity="0.9" />
        <circle cx="12" cy="12" r="12" fill="${markerColor}" stroke="white" stroke-width="1" opacity="0.3" class="pulse-circle" />
      `;
      className += ' user-marker';
      break;
    
    case 'circle':
    default:
      // Enhanced circle for calculated locations - brighter green for better visibility
      markerColor = '#22c55e'; // Brighter green for calculated locations
      svgPath = `
        <circle cx="12" cy="12" r="8" fill="${markerColor}" stroke="white" stroke-width="1.5" />
        <circle cx="12" cy="12" r="12" fill="${markerColor}" stroke="none" opacity="0.2" class="pulse-circle" />
      `;
      className += ' circle-marker';
      break;
  }
  
  // Add improved animation style to the SVG
  const svgWithStyle = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="24" height="24">
      <style>
        @keyframes pulse {
          0% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.3; transform: scale(1.1); }
          100% { opacity: 0.15; transform: scale(0.8); }
        }
        .pulse-circle {
          animation: pulse 2s infinite ease-in-out;
          transform-origin: center;
          transform-box: fill-box;
        }
      </style>
      ${svgPath}
    </svg>
  `;
  
  // Create a div icon with SVG content
  return L.divIcon({
    className: className,
    html: svgWithStyle,
    iconSize: [32, 32], // Increased from 28 for better visibility
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

/**
 * Create a custom pulsing marker icon
 * Useful for indicating the user's current position
 */
export function createPulsingUserMarker(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker pulsing-marker',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <style>
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 0.3; transform: scale(0.8); }
          }
          .pulse-circle {
            animation: pulse 2s infinite ease-in-out;
            transform-origin: center;
            transform-box: fill-box;
          }
        </style>
        <circle cx="12" cy="12" r="6" fill="#3b82f6" stroke="white" stroke-width="2" opacity="0.9" />
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="1" opacity="0.4" class="pulse-circle" />
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}
