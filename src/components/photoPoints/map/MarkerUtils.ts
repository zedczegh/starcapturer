
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { haversineDistance } from '@/utils/geoUtils';

/**
 * Get marker color based on location type and quality
 * @param location Location data
 * @returns Marker color string
 */
export function getMarkerColor(location: SharedAstroSpot): string {
  if (location.isDarkSkyReserve) {
    return '#8B5CF6'; // Purple for Dark Sky Reserves
  }
  
  if (location.certification) {
    return '#3B82F6'; // Blue for certified locations
  }
  
  // For calculated locations, color by quality
  const siqs = location.siqsResult?.siqs || location.siqs || 0;
  
  if (siqs >= 8.0) return '#10B981'; // Emerald for excellent
  if (siqs >= 6.5) return '#22C55E'; // Green for good
  if (siqs >= 5.0) return '#FBBF24'; // Yellow for moderate
  return '#F43F5E'; // Red for poor
}

/**
 * Get distance label text
 * @param location Location data
 * @param userLocation User's location
 * @returns Distance string or null if not available
 */
export function getDistanceLabel(
  location: SharedAstroSpot, 
  userLocation: { latitude: number; longitude: number } | null
): string | null {
  if (!userLocation) return null;
  
  let distance = location.distance;
  
  if (distance === undefined) {
    distance = haversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    );
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance.toFixed(1)}km`;
}

/**
 * Generate tooltip content for a marker
 * @param location Location data
 * @param userLocation User's location for distance calculation (optional)
 * @returns HTML string for tooltip
 */
export function generateTooltipHTML(location: SharedAstroSpot, userLocation?: { latitude: number; longitude: number } | null): string {
  const siqsScore = location.siqsResult?.siqs || location.siqs || 0;
  const distanceText = userLocation ? getDistanceLabel(location, userLocation) : '';
  
  let certificationBadge = '';
  if (location.isDarkSkyReserve) {
    certificationBadge = '<span class="certification-badge dark-sky">Dark Sky Reserve</span>';
  } else if (location.certification) {
    certificationBadge = `<span class="certification-badge">${location.certification}</span>`;
  }
  
  return `
    <div class="marker-tooltip">
      <h4>${location.name || 'Unnamed Location'}</h4>
      ${certificationBadge}
      <p>SIQS: <strong>${siqsScore.toFixed(1)}</strong></p>
      ${distanceText ? `<p>Distance: ${distanceText}</p>` : ''}
    </div>
  `;
}

/**
 * Get zoom level based on search radius
 * @param radius Search radius in kilometers
 * @returns Appropriate zoom level
 */
export function getZoomLevelForRadius(radius: number): number {
  if (radius <= 10) return 12;
  if (radius <= 25) return 11;
  if (radius <= 50) return 10;
  if (radius <= 100) return 9;
  if (radius <= 250) return 8;
  if (radius <= 500) return 7;
  return 6;
}
