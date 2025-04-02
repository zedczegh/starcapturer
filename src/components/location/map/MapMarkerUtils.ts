
import L from 'leaflet';

/**
 * Creates a custom marker with a pulsing animation
 * @param color The color of the marker (hex code)
 * @returns A custom Leaflet icon with pulsing animation
 */
export const createCustomMarker = (color: string): L.DivIcon => {
  return L.divIcon({
    className: 'custom-marker-container',
    html: `
      <div class="custom-marker" style="
        position: relative;
        width: 20px;
        height: 20px;
        background-color: ${color};
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.7);
        transform: translateX(-10px) translateY(-10px);
      ">
        <div class="pulse" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          box-shadow: 0 0 10px ${color};
          animation: pulse 2s infinite;
          opacity: 0.7;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          70% {
            transform: scale(2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};
