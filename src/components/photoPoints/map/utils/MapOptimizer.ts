
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/utils/geoUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Configuration for the map
const FEATURE_COUNT_THRESHOLD = 500;
const CLUSTER_DISTANCE = 40;

/**
 * Optimizes the locations for map display by filtering out invalid locations
 * (e.g., those on water) and preparing them for Leaflet.
 *
 * @param locations An array of SharedAstroSpot objects representing the locations.
 * @param userLocation The user's current location, used for distance calculation.
 * @param searchRadius The radius within which to display locations.
 * @returns An object containing the optimized locations and clustering settings
 */
export function optimizeLocationsForMap(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number
): { 
  optimizedLocations: SharedAstroSpot[], 
  clusteringEnabled: boolean 
} {
  // Filter out locations on water and outside the search radius
  const validLocations = locations.filter(location => {
    if (!location.latitude || !location.longitude) return false;

    // Skip water locations
    if (isWaterLocation(location.latitude, location.longitude)) {
      return false;
    }

    // Skip locations outside the search radius if user location is available
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      return distance <= searchRadius;
    }

    return true;
  });

  // Determine whether to enable clustering based on the number of features
  const enableClustering = validLocations.length > FEATURE_COUNT_THRESHOLD;

  return { 
    optimizedLocations: validLocations, 
    clusteringEnabled: enableClustering 
  };
}

/**
 * Generates marker options for Leaflet based on location properties
 *
 * @param location The location to style
 * @param hoveredLocationId The ID of the currently hovered location
 * @param activeView The active view mode ('certified' or 'calculated')
 * @returns An object with marker style options
 */
export function generateMarkerStyle(
  location: SharedAstroSpot,
  hoveredLocationId: string | null,
  activeView: 'certified' | 'calculated'
): { 
  color: string;
  fillColor: string;
  radius: number;
  weight: number;
  opacity: number;
  fillOpacity: number;
} {
  // Determine the base color based on whether the location is certified
  let baseColor = location.isDarkSkyReserve || location.certification ? '#8b5cf6' : '#3b82f6';

  // If the location is the hovered location, use a different color
  if (location.id === hoveredLocationId) {
    baseColor = '#f97316';
  }

  // If we have a siqsScore that's an object or a number, convert it properly
  const siqsNumericValue = getSiqsScore(location.siqs);

  // Determine the radius based on the SIQS score
  let radius = 6;
  if (siqsNumericValue > 7) {
    radius = 10;
  } else if (siqsNumericValue > 5) {
    radius = 8;
  }

  return {
    color: '#ffffff',
    fillColor: baseColor,
    radius: radius,
    weight: 2,
    opacity: 0.9,
    fillOpacity: 0.8
  };
}

/**
 * Create a Leaflet cluster configuration based on location count
 * 
 * @param locations Array of locations to potentially cluster
 * @returns Leaflet clustering options or null if clustering is not needed
 */
export function getClusterOptions(locations: SharedAstroSpot[]) {
  const enableClustering = locations.length > FEATURE_COUNT_THRESHOLD;
  
  if (!enableClustering) {
    return null;
  }
  
  return {
    chunkedLoading: true,
    disableClusteringAtZoom: 13,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: CLUSTER_DISTANCE,
    iconCreateFunction: createClusterIcon
  };
}

/**
 * Create a custom cluster icon based on the number of points
 */
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 30;
  let className = 'marker-cluster-small';
  
  if (count > 50) {
    size = 45;
    className = 'marker-cluster-large';
  } else if (count > 10) {
    size = 35;
    className = 'marker-cluster-medium';
  }
  
  return L.divIcon({
    html: `<div><span>${count}</span></div>`,
    className: `marker-cluster ${className}`,
    iconSize: L.point(size, size)
  });
}
