import { Cluster } from 'ol/source/Cluster';
import { Vector as VectorSource } from 'ol/source';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { transform } from 'ol/proj';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/utils/geoUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Configuration for the map
const FEATURE_COUNT_THRESHOLD = 500;
const CLUSTER_DISTANCE = 40;
const MAX_FEATURES_PER_CLUSTER = 15;

/**
 * Optimizes the locations for map display by clustering nearby points
 * and filtering out invalid locations (e.g., those on water).
 *
 * @param locations An array of SharedAstroSpot objects representing the locations.
 * @param userLocation The user's current location, used for distance calculation.
 * @param searchRadius The radius within which to display locations.
 * @returns An object containing the optimized locations as a vector source
 *          and a boolean indicating whether clustering is enabled.
 */
export function optimizeLocationsForMap(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number
): { source: VectorSource<Point>, clusteringEnabled: boolean } {
  // Filter out locations on water and outside the search radius
  const validLocations = locations.filter(location => {
    if (!location.latitude || !location.longitude) return false;

    // Skip water locations
    if (isWaterLocation(location.latitude, location.longitude)) {
      return false;
    }

    // Skip locations outside the search radius
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

  // Convert valid locations to OpenLayers features
  const features = validLocations.map(location => {
    const { latitude, longitude } = location;
    const point = new Point(transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'));
    const feature = new Feature(point);
    feature.setProperties(location); // Attach location properties to the feature
    return feature;
  });

  // Create a vector source from the features
  let source = new VectorSource({ features });

  // Determine whether to enable clustering based on the number of features
  const enableClustering = features.length > FEATURE_COUNT_THRESHOLD;

  // If clustering is enabled, create a cluster source
  if (enableClustering) {
    source = new Cluster({
      distance: CLUSTER_DISTANCE,
      source: source,
      geometryFunction: (feature) => {
        // Use the feature itself if it's not a cluster
        if (!feature.get('features')) {
          return feature.getGeometry();
        }

        // For clusters, return the geometry of the first feature
        const featuresInCluster = feature.get('features');
        if (featuresInCluster && featuresInCluster.length > 0) {
          return featuresInCluster[0].getGeometry();
        }

        return null;
      }
    });
  }

  return { source: source as VectorSource<Point>, clusteringEnabled: enableClustering };
}

/**
 * Generates a style for the map features, including clustering.
 *
 * @param feature The feature to style.
 * @param hoveredLocationId The ID of the currently hovered location.
 * @param activeView The active view mode ('certified' or 'calculated').
 * @returns An array of Style objects to apply to the feature.
 */
export function generateMapStyle(
  feature: Feature,
  hoveredLocationId: string | null,
  activeView: 'certified' | 'calculated'
): Style[] {
  const features = feature.get('features');

  // Handle clustered features
  if (features && features.length > 1) {
    const size = features.length;
    const maxDisplay = Math.min(size, MAX_FEATURES_PER_CLUSTER);

    // Style for the cluster circle
    const circleStyle = new Style({
      image: new Circle({
        radius: 12,
        stroke: new Stroke({
          color: '#fff',
        }),
        fill: new Fill({
          color: '#3399CC',
        }),
      }),
      text: new Text({
        text: maxDisplay.toString(),
        fill: new Fill({
          color: '#fff',
        }),
      }),
    });

    return [circleStyle];
  }

  // Handle single features
  const location = feature.getProperties() as SharedAstroSpot;
  if (!location) {
    return [];
  }

  // Determine the base color based on whether the location is certified
  let baseColor = location.isDarkSkyReserve || location.certification ? 'purple' : 'blue';

  // If the location is the hovered location, use a different color
  if (location.id === hoveredLocationId) {
    baseColor = 'orange';
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

  // Style for the single feature
  const singleFeatureStyle = new Style({
    image: new Circle({
      radius: radius,
      fill: new Fill({
        color: baseColor,
      }),
    }),
  });

  return [singleFeatureStyle];
}
