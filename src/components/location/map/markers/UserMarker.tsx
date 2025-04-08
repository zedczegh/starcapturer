
import L from "leaflet";

/**
 * Creates a user location marker with pulsing effect
 * @param color - The color of the marker (default: red)
 * @returns L.DivIcon instance
 */
export function createCustomUserMarker(color: string): L.DivIcon {
  // Use SVG for user marker with a pin shape
  const pinSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 24 30" fill="${color}" stroke="#FFFFFF" stroke-width="1.5">
      <path d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 5.94 7.05 14.86 8.5 16.5 1.45-1.64 8.5-10.56 8.5-16.5C20.5 3.81 16.69 0 12 0zm0 13a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>
    </svg>
  `;

  // Wrap the SVG in a div with proper positioning
  const html = `
    <div style="position: relative; width: 24px; height: 30px; display: flex; justify-content: center; align-items: center; transform: translateZ(0);">
      ${pinSvg}
      <div style="position: absolute; width: 24px; height: 24px; top: 0; left: 0; opacity: 0.5; z-index: -1;" class="pulse-inner-circle"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-marker user-location-marker pulsing-marker",
    html,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -30]
  });
}
