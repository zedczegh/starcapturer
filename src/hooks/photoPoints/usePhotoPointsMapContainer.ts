
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { filterVisibleLocations } from '@/utils/filterUtils';
import { useDevice } from '@/hooks/useDevice';
import { LocationListFilter } from '@/components/photoPoints/ViewToggle';
import { getAllCertifiedLocations } from '@/services/certifiedLocationsService';

interface UsePhotoPointsMapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  activeFilter: LocationListFilter;
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

export const usePhotoPointsMapContainer = ({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  activeFilter,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}: UsePhotoPointsMapContainerProps) => {
  const { isMobile } = useDevice();
  const [mapContainerHeight, setMapContainerHeight] = useState('50vh');
  const [mapReady, setMapReady] = useState(false);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const touchStateRef = useRef<{ touchStartTime: number; touchMoved: boolean }>({
    touchStartTime: 0,
    touchMoved: false
  });
  
  // Get all certified locations to ensure we have all 80+ locations
  const allCertifiedLocations = useCallback(() => {
    const loaded = getAllCertifiedLocations();
    console.log(`usePhotoPointsMapContainer: Got ${loaded.length} certified locations from service`);
    return loaded;
  }, []);
  
  // Ensure we have the complete set of certified locations
  useEffect(() => {
    console.log(`usePhotoPointsMapContainer received ${certifiedLocations.length} certified locations`);
    console.log(`usePhotoPointsMapContainer received ${calculatedLocations.length} calculated locations`);
    console.log(`Active filter: ${activeFilter}`);
    
    // If we don't have many certified locations, load more from the full dataset
    if (certifiedLocations.length < 20 && activeFilter !== 'calculated') {
      const allCertified = allCertifiedLocations();
      console.log(`Additionally loaded ${allCertified.length} certified locations from service`);
    }
  }, [certifiedLocations.length, calculatedLocations.length, activeFilter, allCertifiedLocations]);
  
  // Determine how many locations to display based on device and view
  const getMaxLocations = useCallback(() => {
    // For certified locations, always show all of them (hundreds)
    const certifiedLimit = activeFilter === 'certified' ? 500 : 200;
    
    // For calculated locations, limit based on device
    const calculatedLimit = isMobile ? 30 : 50;
    
    // Return appropriate limit based on filter
    return activeFilter === 'calculated' ? calculatedLimit : certifiedLimit;
  }, [isMobile, activeFilter]);

  // Filter locations based on the active filter
  const filterLocationsByActiveFilter = useCallback(() => {
    // Start with the full set of certified locations
    const allCertified = activeFilter !== 'calculated' ? allCertifiedLocations() : certifiedLocations;
    
    // If showing all, return all locations
    if (activeFilter === 'all') {
      // Create a map to avoid duplicates
      const locationMap = new Map<string, SharedAstroSpot>();
      
      // Add all certified locations first
      allCertified.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      // Then add calculated locations
      calculatedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      const combined = Array.from(locationMap.values());
      console.log(`Filter 'all': Combined ${allCertified.length} certified and ${calculatedLocations.length} calculated for ${combined.length} locations`);
      return combined;
    }
    
    // If showing certified only
    if (activeFilter === 'certified') {
      console.log(`Filter 'certified': Showing ${allCertified.length} certified locations`);
      return allCertified;
    }
    
    // If showing calculated only
    console.log(`Filter 'calculated': Showing ${calculatedLocations.length} calculated locations`);
    return calculatedLocations;
  }, [certifiedLocations, calculatedLocations, activeFilter, allCertifiedLocations]);

  // Optimize locations for the map view
  const optimizedLocations = useCallback(() => {
    // First filter by the active filter selection
    const filteredByType = filterLocationsByActiveFilter();
    
    console.log(`Filtered by type: ${filteredByType.length} locations`);
    
    // Then filter by distance for non-certified locations if we're not in certified view
    const filteredByDistance = userLocation && activeFilter !== 'certified'
      ? filteredByType.map(loc => {
          if (!loc.latitude || !loc.longitude) return loc;
          
          // Skip distance filtering for certified locations
          if (loc.isDarkSkyReserve || loc.certification) return loc;
          
          // Calculate distance if not already set
          const distance = loc.distance || calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          );
          
          // Store the distance for later use
          return { ...loc, distance };
        }).filter(loc => {
          // Always keep certified locations regardless of distance
          if (loc.isDarkSkyReserve || loc.certification) return true;
          
          // Only include calculated locations within current radius
          return (loc.distance || Infinity) <= searchRadius;
        })
      : filteredByType;

    console.log(`Filtered by distance: ${filteredByDistance.length} locations`);

    // Get maximum locations to show
    const maxLocationsToShow = getMaxLocations();
    console.log(`Max locations to show: ${maxLocationsToShow}`);
    
    // For certified locations, don't use optimization to show all of them
    if (activeFilter === 'certified') {
      console.log(`Returning all ${filteredByDistance.length} certified locations without optimization`);
      return filteredByDistance;
    }
    
    // Use filterVisibleLocations to optimize for the map
    const optimized = filterVisibleLocations(
      filteredByDistance, 
      userLocation,
      maxLocationsToShow
    );

    console.log(`After optimization: ${optimized.length} locations`);
    return optimized;
  }, [
    filterLocationsByActiveFilter,
    userLocation, 
    searchRadius,
    getMaxLocations,
    activeFilter
  ]);

  // Calculate map center coordinates 
  const mapCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [35.8617, 104.1954] as [number, number]; // Default center (China)

  // Set dynamic zoom level based on search radius
  const getInitialZoom = useCallback(() => {
    if (activeFilter === 'certified') {
      // For certified view, use a wider view to see more locations globally
      return isMobile ? 2 : 3;
    }
    
    // Use search radius to determine zoom level
    const zoomLevels = [
      { radius: 50, zoom: 10 },
      { radius: 100, zoom: 9 },
      { radius: 200, zoom: 8 },
      { radius: 300, zoom: 7 },
      { radius: 500, zoom: 6 },
      { radius: 1000, zoom: 5 }
    ];
    
    const matchedZoom = zoomLevels.find(level => searchRadius <= level.radius);
    const calculatedZoom = matchedZoom ? matchedZoom.zoom : 5;
    
    // Reduce zoom slightly for mobile
    return isMobile ? Math.max(3, calculatedZoom - 1) : calculatedZoom;
  }, [searchRadius, isMobile, activeFilter]);

  const initialZoom = getInitialZoom();

  // Update map container height for better mobile view
  useEffect(() => {
    const viewportHeight = window.innerHeight;
    const newHeight = isMobile ? `${viewportHeight * 0.6}px` : '70vh';
    setMapContainerHeight(newHeight);
  }, [isMobile]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleLocationClicked = useCallback(
    (location: SharedAstroSpot) => {
      if (onLocationClick) onLocationClick(location);
    },
    [onLocationClick]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (onLocationUpdate) onLocationUpdate(lat, lng);
    },
    [onLocationUpdate]
  );

  const handleHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
  }, []);

  // Touch event handlers for better mobile experience
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    touchStateRef.current.touchStartTime = Date.now();
    touchStateRef.current.touchMoved = false;
    setHoveredLocationId(id);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchStateRef.current.touchMoved = true;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent, id: string | null) => {
      const touchDuration = Date.now() - touchStateRef.current.touchStartTime;
      
      // Only process as click if it was a short tap and didn't move
      if (touchDuration < 500 && !touchStateRef.current.touchMoved && id) {
        const filteredLocations = filterLocationsByActiveFilter();
        const location = filteredLocations.find(loc => {
          const locId = loc.id || `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`;
          return locId === id;
        });
        
        if (location && onLocationClick) {
          onLocationClick(location);
        }
      }
      
      setHoveredLocationId(null);
    },
    [filterLocationsByActiveFilter, onLocationClick]
  );

  const handleGetLocation = useCallback(() => {
    if (!userLocation) {
      console.log("No user location available");
    }
  }, [userLocation]);

  const handleLegendToggle = useCallback(() => {
    console.log("Legend toggled");
  }, []);

  return {
    mapContainerHeight,
    mapReady,
    handleMapReady,
    optimizedLocations: optimizedLocations(),
    mapCenter,
    initialZoom,
    mapRef,
    hoveredLocationId,
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleMapClick,
    handleLocationClicked,
    handleGetLocation,
    handleLegendToggle,
    isMobile
  };
};

export default usePhotoPointsMapContainer;
