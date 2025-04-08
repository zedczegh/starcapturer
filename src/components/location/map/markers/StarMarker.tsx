
import L from "leaflet";

/**
 * Creates a star-shaped marker for certified locations
 * @param color - The color of the marker
 * @returns L.DivIcon instance
 */
export function createCustomStarMarker(color: string): L.DivIcon {
  // Use SVG for the star shape
  const starSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="#FFFFFF" stroke-width="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  `;

  // Wrap the SVG in a div with proper positioning
  const html = `
    <div style="position: relative; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; transform: translateZ(0);">
      ${starSvg}
      <div style="position: absolute; width: 24px; height: 24px; top: 0; left: 0; opacity: 0.5; z-index: -1;" class="pulse-inner-circle"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-marker star-marker",
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}
