
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { filterVisibleLocations } from '@/utils/filterUtils';
import { useDevice } from '@/hooks/useDevice';

interface UsePhotoPointsMapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
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
  
  // Determine how many locations to display based on device
  const getMaxLocations = useCallback(() => {
    if (activeView === 'certified') {
      // Always show ALL certified locations
      return 500;
    } else {
      // For calculated locations, limit based on device
      return isMobile ? 30 : 50;
    }
  }, [activeView, isMobile]);

  // Optimize locations for the map view
  const optimizedLocations = useCallback(() => {
    // Always include ALL certified locations regardless of active view
    const certifiedToInclude = certifiedLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    // For certified view, only show certified locations
    if (activeView === 'certified') {
      return certifiedToInclude;
    }
    
    // For calculated view, show a mix of certified and calculated locations
    const calculatedLocsToShow = calculatedLocations;

    // Filter calculated locations by distance
    const filteredCalculated = userLocation 
      ? calculatedLocsToShow.filter(loc => {
          if (!loc.latitude || !loc.longitude) return false;
          
          // Calculate distance if not already set
          const distance = loc.distance || calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          );
          
          // Only include locations within current radius
          return distance <= searchRadius;
        })
      : calculatedLocsToShow;

    // Combine certified and filtered calculated locations
    // IMPORTANT: Always include certified locations first to ensure they're never filtered out
    const combined = [...certifiedToInclude, ...filteredCalculated];
    
    // Ensure we don't exceed the maximum number of locations for performance
    return filterVisibleLocations(
      combined, 
      userLocation,
      getMaxLocations()
    );
  }, [
    activeView, 
    certifiedLocations, 
    calculatedLocations, 
    userLocation, 
    searchRadius,
    getMaxLocations
  ]);

  // Calculate map center coordinates 
  const mapCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [35.8617, 104.1954] as [number, number]; // Default center (China)

  // Set dynamic zoom level based on search radius
  const getInitialZoom = useCallback(() => {
    if (activeView === 'certified') {
      // For certified view, zoom out to see global locations
      return isMobile ? 3 : 4;
    }
    
    // For calculated view, zoom level depends on search radius
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
  }, [activeView, searchRadius, isMobile]);

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
        const location = optimizedLocations().find(loc => {
          const locId = loc.id || `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`;
          return locId === id;
        });
        
        if (location && onLocationClick) {
          onLocationClick(location);
        }
      }
      
      setHoveredLocationId(null);
    },
    [optimizedLocations, onLocationClick]
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
