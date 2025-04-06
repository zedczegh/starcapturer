
import L from "leaflet";

/**
 * Create a custom marker icon with pulse animation effect
 * @param color - The color of the marker (default: #9b87f5 - matches logo color)
 * @returns L.DivIcon instance or null during SSR
 */
export function createCustomMarker(color = '#9b87f5'): L.DivIcon {
  try {
    const pulseAnimation = `
      @keyframes pulse {
        0% {
          transform: scale(0.5);
          opacity: 0;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }
    `;
    
    const style = document.createElement('style');
    if (!document.head.querySelector('[data-marker-pulse]')) {
      style.setAttribute('data-marker-pulse', 'true');
      style.textContent = pulseAnimation;
      document.head.appendChild(style);
    }

    const markerHtmlStyles = `
      background-color: ${color};
      width: 1.5rem;
      height: 1.5rem;
      display: block;
      position: relative;
      border-radius: 50%;
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      transform: translateX(-0.75rem) translateY(-0.75rem);
    `;

    const pulseStyles = `
      content: '';
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background-color: ${color};
      position: absolute;
      margin: -2px 0 0 -2px;
      animation: pulse 2s infinite;
      opacity: 0.6;
      box-shadow: 0 0 5px ${color};
    `;

    const icon = L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
      tooltipAnchor: [0, -12],
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
