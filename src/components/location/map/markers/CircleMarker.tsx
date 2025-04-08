
import L from "leaflet";

/**
 * Creates a circular marker with pulse effect
 * @param color - The color of the marker
 * @returns L.DivIcon instance
 */
export function createCustomCircleMarker(color: string): L.DivIcon {
  const markerHtmlStyles = `
    background-color: ${color};
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    border-radius: 50%;
    position: relative;
    border: 2px solid #FFFFFF;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    transform: translateZ(0);
  `;

  const pulseStyles = `
    content: '';
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background-color: ${color};
    position: absolute;
    margin: -2px 0 0 -2px;
    z-index: -1;
    opacity: 0.5;
    transform-origin: center center;
    transform: translateZ(0);
    box-shadow: 0 0 5px ${color};
  `;

  return L.divIcon({
    className: "custom-marker circle-marker",
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: `<span style="${markerHtmlStyles}">
             <span class="pulse-circle" style="${pulseStyles}"></span>
           </span>`,
    iconSize: [24, 24]
  });
}
