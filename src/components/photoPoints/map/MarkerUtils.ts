
import L from 'leaflet';
import { getSiqsColorClass } from '@/utils/mapSiqsDisplay';

interface CustomIconOptions {
  isHovered?: boolean;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  siqs?: number;
  isForecast?: boolean;
  forecastDay?: number;
}

export const createCustomIcon = ({
  isHovered = false,
  isCertified = false,
  isDarkSkyReserve = false,
  siqs = 0,
  isForecast = false,
  forecastDay = 1
}: CustomIconOptions = {}) => {
  // Base size for the icon
  const baseSize = isHovered ? 30 : 24;
  const certifiedSize = isHovered ? 34 : 28;
  
  let iconHtml = '';
  let iconSize = baseSize;

  // Different HTML based on location type
  if (isDarkSkyReserve) {
    // Gold star for dark sky reserves
    iconHtml = `<div class="star-icon dark-sky-reserve ${isHovered ? 'hovered' : ''}"></div>`;
    iconSize = certifiedSize;
  } else if (isCertified) {
    // Green star for certified locations
    iconHtml = `<div class="star-icon certified ${isHovered ? 'hovered' : ''}"></div>`;
    iconSize = certifiedSize;
  } else if (isForecast) {
    // Special forecast icon with cloud symbol and day number
    const colorClass = siqs ? getSiqsColorClass(siqs) : 'bg-primary';
    iconHtml = `
      <div class="forecast-icon ${isHovered ? 'hovered' : ''} ${colorClass}">
        <div class="forecast-icon-inner">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
          </svg>
          <span class="forecast-day">${forecastDay || 1}</span>
        </div>
      </div>
    `;
    iconSize = isHovered ? 40 : 32;
  } else {
    // Regular circle marker with color based on SIQS
    const colorClass = siqs ? getSiqsColorClass(siqs) : 'bg-primary';
    iconHtml = `<div class="circle-marker ${isHovered ? 'hovered' : ''} ${colorClass}"></div>`;
  }

  // Create and return the custom icon
  return L.divIcon({
    className: 'custom-map-marker',
    html: iconHtml,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2]
  });
};

/**
 * Get distance between two coordinates in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Generate a random point within a radius around a center coordinate
 */
export const generateRandomPoint = (centerLat: number, centerLng: number, radiusKm: number) => {
  const radiusInDegrees = radiusKm / 111.32; // Roughly 111.32 km in 1 degree at equator
  
  // Use square root for uniform distribution
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  // Adjust for the Earth's curvature
  const newLng = x / Math.cos((centerLat * Math.PI) / 180) + centerLng;
  const newLat = y + centerLat;
  
  // Calculate distance from center
  const distance = calculateDistance(centerLat, centerLng, newLat, newLng);
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance
  };
};
