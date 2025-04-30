
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Get CSS class for SIQS value
 * @param siqs SIQS score
 * @returns CSS class name
 */
export const getSiqsClass = (siqs: number | { score: number; isViable: boolean } | undefined | null): string => {
  if (siqs === undefined || siqs === null) return '';
  
  let score: number;
  if (typeof siqs === 'number') {
    score = siqs;
  } else if (typeof siqs === 'object' && 'score' in siqs) {
    score = siqs.score;
  } else {
    return '';
  }
  
  // If score is on a scale of 0-100, convert to 0-10
  if (score > 10) {
    score = score / 10;
  }
  
  if (score >= 7.5) return 'siqs-excellent';
  if (score >= 5) return 'siqs-good';
  if (score > 0) return 'siqs-poor';
  return '';
};

/**
 * Get color for certification badge
 * @param certification Certification name
 * @returns Hex color code
 */
export const getCertificationColor = (certification: string | undefined): string => {
  if (!certification) return '#6366f1';
  
  // Different colors based on certification type
  if (certification.includes('International')) return '#10b981';
  if (certification.includes('National')) return '#f59e0b';
  if (certification.includes('State') || certification.includes('Provincial')) return '#8b5cf6';
  return '#6366f1'; // Default
};

/**
 * Get marker color based on location properties
 * @param location Location data
 * @returns Hex color code
 */
export const getLocationColor = (location: SharedAstroSpot): string => {
  if (location.isDarkSkyReserve || location.certification) {
    return '#10b981'; // Green for certified
  }
  
  const siqs = location.siqs;
  if (!siqs) return 'rgba(99, 102, 241, 0.8)'; // Default
  
  let score: number;
  if (typeof siqs === 'number') {
    score = siqs;
  } else if (typeof siqs === 'object' && 'score' in siqs) {
    score = siqs.score;
  } else {
    return 'rgba(99, 102, 241, 0.8)';
  }
  
  // If score is on a scale of 0-100, convert to 0-10
  if (score > 10) {
    score = score / 10;
  }
  
  if (score >= 7.5) return 'rgba(34, 197, 94, 0.9)'; // Green
  if (score >= 5) return 'rgba(250, 204, 21, 0.9)'; // Yellow
  return 'rgba(234, 88, 12, 0.9)'; // Orange/Red
};

/**
 * Get location marker icon based on properties
 * @param location Location data
 * @param isCertified Is certified location
 * @param isHovered Currently hovered
 * @param isForecast Is forecast location
 * @returns Leaflet icon object
 */
export const getLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean,
  isHovered: boolean,
  isForecast: boolean
): L.DivIcon => {
  const size = isHovered ? 24 : 20;
  const color = getLocationColor(location);
  const siqsClass = getSiqsClass(location.siqs);
  
  // Base style for the marker
  const baseStyle = `
    width: ${size}px;
    height: ${size}px;
    background-color: ${color};
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: ${isHovered ? 'scale(1.2)' : 'scale(1)'};
    transition: transform 0.2s ease;
    z-index: ${isHovered ? 1000 : 500};
  `;
  
  // Create star shape for certified locations
  const starStyle = isCertified ? `
    clip-path: polygon(
      50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 
      50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
    );
  ` : '';
  
  // Add forecast indicator
  const forecastIndicator = isForecast ? `
    <div style="position: absolute; top: -8px; right: -8px; background-color: #3b82f6; border-radius: 50%; width: 12px; height: 12px; border: 1px solid white;"></div>
  ` : '';
  
  return L.divIcon({
    className: `location-marker ${siqsClass} ${isCertified ? 'star-marker' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
    html: `
      <div style="${baseStyle} ${starStyle}">
        ${forecastIndicator}
      </div>
    `
  });
};

/**
 * Check if a marker should be shown
 * @param location Location data
 * @param isCertified Is this a certified location
 * @param activeView Current view mode
 * @returns True if marker should be shown
 */
export const shouldShowLocationMarker = (
  location: SharedAstroSpot,
  isCertified: boolean,
  activeView: 'certified' | 'calculated'
): boolean => {
  // Show certified locations only in certified view
  if (activeView === 'certified') {
    return isCertified;
  }
  
  // In calculated view, show non-certified locations
  return !isCertified;
};
