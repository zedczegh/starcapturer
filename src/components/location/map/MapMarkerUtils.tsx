
import L from "leaflet";

/**
 * Create a custom marker icon with pulse animation effect
 * @param color - The color of the marker (default: #f43f5e)
 * @returns L.DivIcon instance or null during SSR
 */
export function createCustomMarker(color = '#f43f5e'): L.DivIcon | null {
  // Return null during SSR to prevent errors
  if (typeof window === 'undefined') return null;
  
  try {
    const markerHtmlStyles = `
      background-color: ${color};
      width: 2rem;
      height: 2rem;
      display: block;
      position: relative;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 1px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    `;

    const pulseStyles = `
      content: '';
      width: 2rem;
      height: 2rem;
      border-radius: 50% 50% 50% 0;
      background-color: ${color};
      position: absolute;
      margin: -1px 0 0 -1px;
      animation: pulse 2s infinite;
      opacity: 0.5;
      box-shadow: 0 0 5px ${color};
      
      @keyframes pulse {
        0% {
          transform: scale(0.5);
          opacity: 0;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
    `;

    const icon = L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
      html: `<span style="${markerHtmlStyles}">
               <span style="${pulseStyles}"></span>
             </span>`,
      iconSize: [24, 24]
    });

    return icon;
  } catch (error) {
    console.error("Error creating custom marker:", error);
    // Return default icon as fallback
    return new L.Icon.Default();
  }
}

/**
 * Configure Leaflet default settings
 * Avoids SSR issues by running only on client side
 */
export function configureLeaflet(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Only run this on the client side
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  } catch (error) {
    console.error("Error configuring Leaflet:", error);
  }
}

// Call configure function immediately but only on client
if (typeof window !== 'undefined') {
  configureLeaflet();
}
