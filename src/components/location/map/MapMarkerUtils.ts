
import L from "leaflet";

/**
 * Create a custom marker icon with pulse animation effect
 * @param color - The color of the marker (default: #9b87f5 - matches logo color)
 * @param shape - The shape of the marker ('circle', 'star', 'user')
 * @returns L.DivIcon instance or null during SSR
 */
export function createCustomMarker(color = '#9b87f5', shape = 'circle'): L.DivIcon {
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

    let markerHtmlStyles = '';
    let pulseStyles = '';
    
    // Different styles based on marker type
    switch (shape) {
      case 'star': 
        // Star shape for certified locations
        markerHtmlStyles = `
          position: relative;
          width: 0;
          height: 0;
          border-right: 0.5rem solid transparent;
          border-bottom: 0.35rem solid ${color};
          border-left: 0.5rem solid transparent;
          transform: translateX(-0.5rem) translateY(-0.5rem) rotate(35deg);

          &:before {
            border-bottom: 0.4rem solid ${color};
            border-left: 0.15rem solid transparent;
            border-right: 0.15rem solid transparent;
            position: absolute;
            height: 0;
            width: 0;
            top: -0.23rem;
            left: -0.3rem;
            content: '';
            transform: rotate(-35deg);
          }

          &:after {
            position: absolute;
            height: 0;
            width: 0;
            border-right: 0.5rem solid transparent;
            border-bottom: 0.35rem solid ${color};
            border-left: 0.5rem solid transparent;
            top: 0;
            left: -0.85rem;
            content: '';
            transform: rotate(-70deg);
          }
        `;
        
        pulseStyles = `
          content: '';
          position: absolute;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background-color: ${color};
          animation: pulse 2s infinite;
          opacity: 0.4;
          box-shadow: 0 0 5px ${color};
          transform: translateX(-0.4rem) translateY(-0.7rem);
        `;
        break;
        
      case 'user':
        // Distinctive marker for user location with pulsing effect
        markerHtmlStyles = `
          background-color: ${color};
          width: 1.5rem;
          height: 1.5rem;
          display: block;
          position: relative;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          transform: translateX(-0.75rem) translateY(-0.75rem);
        `;
        
        pulseStyles = `
          content: '';
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background-color: ${color};
          position: absolute;
          margin: -3px 0 0 -3px;
          animation: pulse 2s infinite;
          opacity: 0.6;
          box-shadow: 0 0 10px ${color};
        `;
        break;
        
      default:
        // Regular circle for calculated locations
        markerHtmlStyles = `
          background-color: ${color};
          width: 1.2rem;
          height: 1.2rem;
          display: block;
          position: relative;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
          transform: translateX(-0.6rem) translateY(-0.6rem);
        `;
        
        pulseStyles = `
          content: '';
          width: 1.2rem;
          height: 1.2rem;
          border-radius: 50%;
          background-color: ${color};
          position: absolute;
          margin: -2px 0 0 -2px;
          animation: pulse 2s infinite;
          opacity: 0.4;
          box-shadow: 0 0 5px ${color};
        `;
        break;
    }

    const icon = L.divIcon({
      className: `custom-marker-icon marker-${shape}`,
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
