
/**
 * Marker utilities for map components
 */
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Get appropriate SIQS CSS class for styling
 */
export function getSiqsClass(score: number | null) {
  if (!score || score <= 0) return 'siqs-unknown';
  if (score >= 8) return 'siqs-excellent';
  if (score >= 6.5) return 'siqs-good';
  if (score >= 5) return 'siqs-average';
  if (score >= 3.5) return 'siqs-fair';
  return 'siqs-poor';
}

/**
 * Create a location marker based on properties
 */
export function getLocationMarker(
  location: SharedAstroSpot,
  isCertified: boolean,
  isHovered: boolean,
  isMobile: boolean
) {
  // Determine marker type
  const markerType = isCertified ? 'star' : 'circle';
  
  // Get SIQS score safely
  const siqs = getSiqsScore(location.siqs) || 0;
  
  // Get marker color based on score
  let color = '#999';
  if (siqs >= 8) color = '#10b981';
  else if (siqs >= 6.5) color = '#84cc16';
  else if (siqs >= 5) color = '#facc15';
  else if (siqs >= 3.5) color = '#f97316';
  else if (siqs > 0) color = '#ef4444';
  
  // Make certified locations blue
  if (isCertified) {
    color = '#3b82f6';
  }
  
  // Create marker icon
  const size = isHovered ? (isMobile ? 22 : 28) : (isMobile ? 18 : 22);
  
  const iconHtml = markerType === 'star'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1" width="${size}" height="${size}"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.2L12 2z"/></svg>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;"></div>`;
    
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}
