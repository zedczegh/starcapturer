
/**
 * Service for performing radius-based location searches
 * Focuses on finding the best locations for astronomy viewing within a radius
 */

import { SharedAstroSpot, getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { getCachedLocationSearch, cacheLocationSearch } from '@/services/locationCacheService';
import { calculateDistance } from '@/lib/api/coordinates';
import { locationDatabase } from '@/data/locationDatabase';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';

/**
 * Find all locations within a radius of a center point
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param certifiedOnly Whether to return only certified locations
 * @param limit Maximum number of locations to return (defaults to 50)
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false,
  limit: number = 50
): Promise<SharedAstroSpot[]> {
  try {
    // Check cache first with more specific cache key
    const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${certifiedOnly ? 'certified' : 'all'}-${limit}`;
    const cachedData = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
    
    if (cachedData) {
      console.log(`Using cached location search for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}, radius: ${radius}km, limit: ${limit}`);
      return certifiedOnly 
        ? cachedData.filter(loc => loc.isDarkSkyReserve || loc.certification)
        : cachedData;
    }
    
    console.log(`Finding locations within ${radius}km radius of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, limit: ${limit}`);
    
    // If we're only looking for certified locations, we can also check the local database
    if (certifiedOnly) {
      // Find dark sky locations from our local database
      const localDarkSkyLocations = findLocalDarkSkyLocations(latitude, longitude, radius);
      
      if (localDarkSkyLocations.length > 0) {
        console.log(`Found ${localDarkSkyLocations.length} local dark sky locations within radius`);
      }
      
      // Get recommended points from API with provided limit
      const apiPoints = await getRecommendedPhotoPoints(
        latitude, 
        longitude, 
        radius,
        true, // certified only
        limit // use passed limit
      );
      
      // Filter out water locations
      const validApiPoints = apiPoints.filter(point => 
        isValidAstronomyLocation(point.latitude, point.longitude, point.name)
      );
      
      if (validApiPoints.length < apiPoints.length) {
        console.log(`Filtered out ${apiPoints.length - validApiPoints.length} water locations from API results`);
      }
      
      // Combine results, removing duplicates (prefer API data)
      const apiIds = new Set(validApiPoints.map(p => p.id));
      const combinedLocations = [
        ...validApiPoints,
        ...localDarkSkyLocations.filter(p => !apiIds.has(p.id))
      ];
      
      // Calculate SIQS for all locations
      const locationsWithSiqs = await batchCalculateSiqs(combinedLocations);
      
      // Cache results
      cacheLocationSearch(latitude, longitude, radius, locationsWithSiqs, cacheKey);
      
      return locationsWithSiqs;
    } else {
      // For all locations, get everything from API
      const apiPoints = await getRecommendedPhotoPoints(
        latitude, 
        longitude, 
        radius,
        false, // all locations
        limit
      );
      
      // Filter out water locations - very important!
      const validApiPoints = apiPoints.filter(point => 
        isValidAstronomyLocation(point.latitude, point.longitude, point.name)
      );
      
      if (validApiPoints.length < apiPoints.length) {
        console.log(`Filtered out ${apiPoints.length - validApiPoints.length} water locations from API results`);
      }
      
      // Calculate SIQS for all locations
      const locationsWithSiqs = await batchCalculateSiqs(validApiPoints);
      
      // Cache results
      cacheLocationSearch(latitude, longitude, radius, locationsWithSiqs, cacheKey);
      
      return locationsWithSiqs;
    }
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    return [];
  }
}

/**
 * Find certified dark sky locations within a radius
 * Uses local database for faster lookups
 */
function findLocalDarkSkyLocations(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  try {
    const darkSkyLocations = locationDatabase.filter(
      loc => loc.isDarkSite || loc.type === 'dark-site'
    );
    
    return darkSkyLocations
      .map(loc => {
        const distance = calculateDistance(
          latitude,
          longitude,
          loc.coordinates[0],
          loc.coordinates[1]
        );
        
        if (distance <= radius) {
          return {
            id: `local-${loc.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: loc.name,
            latitude: loc.coordinates[0],
            longitude: loc.coordinates[1],
            distance,
            bortleScale: loc.bortleScale,
            isDarkSkyReserve: true,
            certification: 'IDA', // Assumption for local database
            siqs: Math.max(0, 10 - loc.bortleScale) // Initial estimate
          };
        }
        return null;
      })
      .filter(Boolean) as SharedAstroSpot[];
  } catch (error) {
    console.error("Error finding local dark sky locations:", error);
    return [];
  }
}

/**
 * Find calculated locations good for stargazing
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param expandIfEmpty Whether to expand radius if no results found
 * @param limit Maximum number of locations to return
 * @returns Promise resolving to array of SharedAstroSpot
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  expandIfEmpty: boolean = true,
  limit: number = 20
): Promise<SharedAstroSpot[]> {
  try {
    // Check cache first
    const cacheKey = `calculated-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}-${limit}`;
    const cachedData = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
    
    if (cachedData) {
      // Filter again for water just to be sure
      const validLocations = cachedData.filter(loc => 
        isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)
      );
      return validLocations;
    }
    
    // Get dark sky locations from local database as a starting point
    const localDarkSky = findLocalDarkSkyLocations(latitude, longitude, radius);
    
    // Generate grid of potential points (excluding water locations)
    const gridPoints = generateCalculatedLocations(
      latitude, 
      longitude, 
      radius,
      limit,
      30 // space points 30km apart roughly
    );
    
    console.log(`Generated ${gridPoints.length} calculated grid points`);
    
    // If we still don't have enough points and allowed to expand, try with larger radius
    if (gridPoints.length < limit / 2 && expandIfEmpty) {
      const expandedRadius = Math.min(radius * 1.5, 5000);
      if (expandedRadius > radius) {
        console.log(`Expanding search radius to ${expandedRadius}km for more calculated locations`);
        const expandedPoints = generateCalculatedLocations(
          latitude,
          longitude,
          expandedRadius,
          limit,
          50 // more spacing for expanded area
        );
        
        // Add expanded points
        expandedPoints.forEach(point => {
          if (!gridPoints.some(p => 
            Math.abs(p.latitude - point.latitude) < 0.05 && 
            Math.abs(p.longitude - point.longitude) < 0.05
          )) {
            gridPoints.push(point);
          }
        });
      }
    }
    
    // Combine with local dark sky locations
    const combinedPoints = [...gridPoints];
    
    // Add local dark sky locations if they don't overlap with grid points
    localDarkSky.forEach(loc => {
      if (!combinedPoints.some(p => 
        Math.abs(p.latitude - loc.latitude) < 0.1 && 
        Math.abs(p.longitude - loc.longitude) < 0.1
      )) {
        combinedPoints.push(loc);
      }
    });
    
    // Calculate SIQS for all points
    if (combinedPoints.length > 0) {
      console.log(`Calculating SIQS for ${combinedPoints.length} locations`);
      const pointsWithSiqs = await batchCalculateSiqs(combinedPoints);
      
      // Sort by SIQS score (highest first)
      const sortedPoints = sortLocationsByQuality(pointsWithSiqs);
      
      // Limit to requested number
      const limitedPoints = sortedPoints.slice(0, limit);
      
      // Cache results
      cacheLocationSearch(latitude, longitude, radius, limitedPoints, cacheKey);
      
      return limitedPoints;
    }
    
    return [];
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
}

/**
 * Generate a grid of calculated locations around a center point
 * with intelligent filtering to avoid water and unusable areas
 */
function generateCalculatedLocations(
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number,
  spacing: number = 30 // default spacing between points in km
): SharedAstroSpot[] {
  const result: SharedAstroSpot[] = [];
  const pointsSet = new Set<string>();
  
  // Calculate degree spacing based on latitude
  // At the equator, 1 degree is about 111km, but this decreases with latitude
  const latSpacing = spacing / 111;
  const lngSpacing = spacing / (111 * Math.cos(centerLat * Math.PI / 180));
  
  // Calculate grid bounds
  const latRange = radius / 111;
  const lngRange = radius / (111 * Math.cos(centerLat * Math.PI / 180));
  
  const minLat = Math.max(-90, centerLat - latRange);
  const maxLat = Math.min(90, centerLat + latRange);
  const minLng = centerLng - lngRange;
  const maxLng = centerLng + lngRange;
  
  // Helper to get a good point name
  const getPointName = (lat: number, lng: number, distance: number) => {
    if (distance < 10) {
      return "Nearby Observation Point";
    } else if (distance < 50) {
      return "Local Viewing Area";
    } else if (distance < 200) {
      return "Regional Dark Sky Spot";
    } else {
      return "Remote Observation Area";
    }
  };
  
  // Try mountain peaks and elevated areas first (better for viewing)
  const elevatedPoints = [
    { lat: centerLat + latRange * 0.3, lng: centerLng + lngRange * 0.4, name: "Mountain Peak Viewpoint" },
    { lat: centerLat - latRange * 0.25, lng: centerLng - lngRange * 0.35, name: "Elevated Lookout Point" },
    { lat: centerLat + latRange * 0.6, lng: centerLng - lngRange * 0.2, name: "Scenic Observation Area" },
    { lat: centerLat - latRange * 0.5, lng: centerLng + lngRange * 0.3, name: "Hill Viewing Platform" },
    { lat: centerLat + latRange * 0.1, lng: centerLng + lngRange * 0.7, name: "Peak Observation Area" },
  ];
  
  // Check each elevated point
  for (const point of elevatedPoints) {
    const distance = calculateDistance(centerLat, centerLng, point.lat, point.lng);
    
    // Skip if outside radius or on water
    if (distance > radius || !isValidAstronomyLocation(point.lat, point.lng, point.name)) {
      continue;
    }
    
    const id = `calculated-${Math.round(point.lat * 1000)}-${Math.round(point.lng * 1000)}`;
    const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
    
    if (!pointsSet.has(key)) {
      pointsSet.add(key);
      result.push({
        id: `calculated-${Math.floor(Math.random() * 10)}-${Date.now()}`,
        name: point.name,
        latitude: point.lat,
        longitude: point.lng,
        distance: distance,
        bortleScale: 4,
        siqs: 0 // to be calculated
      });
      
      if (result.length >= limit) break;
    }
  }
  
  // Fill in with grid points if we don't have enough
  if (result.length < limit) {
    // Generate a spiral pattern outward from center
    const spiral = generateSpiralPattern(centerLat, centerLng, radius, spacing, limit - result.length);
    
    for (const point of spiral) {
      const distance = calculateDistance(centerLat, centerLng, point.lat, point.lng);
      
      // Skip if on water or not a valid astronomy location
      if (!isValidAstronomyLocation(point.lat, point.lng)) {
        continue;
      }
      
      const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
      
      if (!pointsSet.has(key)) {
        pointsSet.add(key);
        result.push({
          id: `calculated-${Math.floor(Math.random() * 10)}-${Date.now()}`,
          name: getPointName(point.lat, point.lng, distance),
          latitude: point.lat,
          longitude: point.lng,
          distance: distance,
          bortleScale: 4, // Default, will be updated later
          siqs: 0 // to be calculated
        });
        
        if (result.length >= limit) break;
      }
    }
  }
  
  return result;
}

/**
 * Generate a spiral pattern of points from center
 * This creates a more natural distribution than a grid
 */
function generateSpiralPattern(
  centerLat: number,
  centerLng: number,
  radius: number,
  spacing: number,
  limit: number
): Array<{lat: number, lng: number}> {
  const points: Array<{lat: number, lng: number}> = [];
  const radiusInDegrees = radius / 111;
  
  // Convert spacing to degrees
  const spacingLat = spacing / 111;
  const spacingLng = spacing / (111 * Math.cos(centerLat * Math.PI / 180));
  
  // Start at center and spiral outward
  let angle = 0;
  let r = 0;
  
  while (r < radiusInDegrees && points.length < limit * 3) { // Generate extra points to account for filtering
    // Convert to cartesian coordinates
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    
    // Convert to lat/lng offset
    const latOffset = y;
    const lngOffset = x / Math.cos((centerLat + latOffset) * Math.PI / 180);
    
    // Add to center
    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    
    // Check if within valid lat/lng bounds
    if (lat >= -90 && lat <= 90) {
      points.push({ lat, lng });
    }
    
    // Increase angle and radius for next point
    angle += 0.5; // smaller angle increments = more points
    r += spacingLat / (2 * Math.PI); // gradually increase radius
  }
  
  // Filter out excess points beyond our limit
  return points.slice(0, limit * 3);
}

/**
 * Sort locations by quality criteria - SIQS score and distance
 * @param locations Array of locations to sort
 * @returns Sorted array of locations (best first)
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  // First, filter out any locations with SIQS = 0
  const validLocations = locations.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
  
  // Create a quality score for each location
  const locationsWithQuality = validLocations.map(loc => {
    // Normalize distance to 0-1 scale (closer is better)
    const normalizedDistance = Math.min(1, (loc.distance || 0) / 1000);
    
    // Certified locations get a bonus
    const certificationBonus = (loc.isDarkSkyReserve || loc.certification) ? 2 : 0;
    
    // Calculate weighted quality score (SIQS has highest weight)
    const qualityScore = (
      (loc.siqs || 0) * 0.7 + // SIQS is most important
      (1 - normalizedDistance) * 0.2 + // Distance 
      certificationBonus * 0.1 // Certification bonus
    );
    
    return {
      ...loc,
      qualityScore
    };
  });
  
  // Sort by quality score (highest first)
  return locationsWithQuality
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .map(loc => {
      // Remove the temporary qualityScore field
      const { qualityScore, ...rest } = loc;
      return rest;
    });
}
