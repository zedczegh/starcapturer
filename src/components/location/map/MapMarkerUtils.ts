
import L from 'leaflet';

// Configure Leaflet with required settings
export const configureLeaflet = () => {
  // Fix the default icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png', 
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png'
  });
};

// Create a customized marker with specified color and shape
export const createCustomMarker = (
  color: string = '#4ade80', 
  type: 'circle' | 'star' | 'pulse' = 'circle'
): L.DivIcon => {
  let svgContent: string;
  
  if (type === 'star') {
    // Star shape for certified locations
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${color}">
        <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z"/>
        <circle cx="12" cy="12" r="4" fill="${color}" opacity="0.4" class="pulse-inner-circle" />
      </svg>
    `;
  } else if (type === 'pulse') {
    // Pulsing marker for user location
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.2" class="pulse-circle"/>
        <circle cx="12" cy="12" r="6" fill="${color}" opacity="0.6" />
        <circle cx="12" cy="12" r="3" fill="#ffffff" />
      </svg>
    `;
  } else {
    // Default circle shape
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
        <circle cx="12" cy="12" r="8" fill="${color}" />
        <circle cx="12" cy="12" r="4" fill="white" opacity="0.6" />
      </svg>
    `;
  }
  
  // Create the marker HTML with proper classes
  const markerHTML = `<div class="custom-marker ${type}-marker">${svgContent}</div>`;
  
  return L.divIcon({
    html: markerHTML,
    className: '', // Empty to prevent default styling
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};
