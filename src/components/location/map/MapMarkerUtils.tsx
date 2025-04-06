
import L from 'leaflet';

interface MarkerOptions {
  className?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
}

/**
 * Create a custom marker icon with the specified color
 * @param color Hex color for the marker
 * @param options Additional options for the marker
 * @returns Leaflet Icon instance
 */
export function createCustomMarker(
  color: string = '#3b82f6', 
  options: MarkerOptions = {}
): L.Icon {
  const defaultSize: [number, number] = [25, 41];
  const defaultAnchor: [number, number] = [12, 41];
  const defaultPopupAnchor: [number, number] = [1, -34];
  
  const { 
    className = '', 
    iconSize = defaultSize,
    iconAnchor = defaultAnchor,
    popupAnchor = defaultPopupAnchor 
  } = options;
  
  // Create an SVG marker with the specified color
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${iconSize[0]}" height="${iconSize[1]}">
      <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
      <circle fill="white" cx="12" cy="12" r="4"/>
    </svg>
  `;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor,
    className: className
  });
}
