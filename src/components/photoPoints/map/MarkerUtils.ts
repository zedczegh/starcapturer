
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
  const siqsValue = typeof location.siqsResult?.score === 'number' 
    ? location.siqsResult.score 
    : (typeof location.siqs === 'number' ? location.siqs : 0);
  
  if (siqsValue >= 8.0) return '#10B981'; // Emerald for excellent
  if (siqsValue >= 6.5) return '#22C55E'; // Green for good
  if (siqsValue >= 5.0) return '#FBBF24'; // Yellow for moderate
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
  const siqsValue = typeof location.siqsResult?.score === 'number' 
    ? location.siqsResult.score 
    : (typeof location.siqs === 'number' ? location.siqs : 0);
  
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
      <p>SIQS: <strong>${siqsValue.toFixed(1)}</strong></p>
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

/**
 * Get CSS class for SIQS value
 * @param location Location data
 * @returns CSS class string
 */
export function getSiqsClass(location: SharedAstroSpot): string {
  const siqsValue = typeof location.siqsResult?.score === 'number' 
    ? location.siqsResult.score 
    : (typeof location.siqs === 'number' ? location.siqs : 0);
  
  if (siqsValue >= 8) return 'siqs-excellent';
  if (siqsValue >= 6.5) return 'siqs-good';
  if (siqsValue >= 5) return 'siqs-moderate';
  if (siqsValue >= 3) return 'siqs-poor';
  return 'siqs-bad';
}

/**
 * Get appropriate marker for location
 * @param location Location data
 * @returns Marker class name
 */
export function getLocationMarker(location: SharedAstroSpot): string {
  if (location.isDarkSkyReserve) return 'reserve-marker';
  if (location.certification) return 'certified-marker';
  
  const siqsValue = typeof location.siqsResult?.score === 'number' 
    ? location.siqsResult.score 
    : (typeof location.siqs === 'number' ? location.siqs : 0);
  
  if (siqsValue >= 7) return 'excellent-marker';
  if (siqsValue >= 5) return 'good-marker';
  return 'regular-marker';
}

/**
 * Check if location is a water spot (not suitable for astronomy)
 * @param location Location data
 * @returns True if water spot
 */
export function isWaterSpot(location: SharedAstroSpot): boolean {
  // Check by name keywords
  if (location.name) {
    const lowerName = location.name.toLowerCase();
    const waterKeywords = ['ocean', 'sea', 'bay', 'lake', 'reservoir', 'gulf', 'strait'];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) return true;
    }
  }
  
  return false;
}

/**
 * Check if location is valid for astronomy
 * @param location Location data
 * @returns True if valid for astronomy
 */
export function isValidAstronomyLocation(location: SharedAstroSpot): boolean {
  // Water spots are not valid
  if (isWaterSpot(location)) return false;
  
  // Check coordinates in reasonable range
  if (!location.latitude || !location.longitude) return false;
  if (location.latitude < -90 || location.latitude > 90) return false;
  if (location.longitude < -180 || location.longitude > 180) return false;
  
  // Null island (0,0) is likely an error
  if (Math.abs(location.latitude) < 0.01 && Math.abs(location.longitude) < 0.01) return false;
  
  return true;
}
