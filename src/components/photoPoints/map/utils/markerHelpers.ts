
import L from 'leaflet';

/**
 * Create a custom map marker with specified color, shape, and size
 * 
 * @param color Marker fill color
 * @param shape Shape ('circle' or 'square')
 * @param sizeMultiplier Size multiplier (default: 1.0)
 * @returns Leaflet Icon instance
 */
export function createCustomMarker(
  color: string,
  shape: 'circle' | 'square' = 'circle',
  sizeMultiplier: number = 1.0
): L.DivIcon {
  const baseSize = 14;
  const size = Math.round(baseSize * sizeMultiplier);
  const borderWidth = Math.max(2, Math.round(size * 0.14));
  
  const borderRadius = shape === 'circle' ? '50%' : '3px';
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: ${borderRadius};
      border: ${borderWidth}px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>`,
    className: `custom-marker ${shape}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}
