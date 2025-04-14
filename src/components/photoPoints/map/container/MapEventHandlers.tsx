
import { useCallback, useRef } from 'react';
import { getCurrentPosition } from '@/utils/geolocationUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapEventHandlersProps {
  onMapClick?: (lat: number, lng: number) => void;
  onMapReady?: () => void;
}

/**
 * Hook to handle map events with enhanced mobile support
 */
export const useMapEventHandlers = ({
  onMapClick,
  onMapReady
}: MapEventHandlersProps) => {
  const mapRef = useRef<any>(null);
  const isMobile = useIsMobile();
  const clickTimeoutRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  
  // Handle map ready with mobile-specific optimizations
  const handleMapReady = useCallback(() => {
    if (onMapReady) {
      onMapReady();
    }
    
    // Make map instance available globally for external access
    if (mapRef.current) {
      (window as any).leafletMap = mapRef.current;
      
      // Mobile-specific map setup
      if (isMobile) {
        const map = mapRef.current;
        
        // Enhance touch interaction
        if (map.tap) {
          map.tap.disable();
          
          // Short delay to reset and improve touch handling
          setTimeout(() => {
            if (map.tap) {
              map.tap.enable();
            }
          }, 100);
        }
        
        // Improve dragging experience on mobile
        if (map.dragging._draggable) {
          map.dragging._draggable._inertia = true;
          map.dragging._draggable.options.inertiaDeceleration = 2200;  // Smoother stops
          map.dragging._draggable.options.inertiaMaxSpeed = 1500;      // More responsive feel
        }
        
        // Setup drag detection for better click handling
        map.on('dragstart', () => {
          isDraggingRef.current = true;
        });
        
        map.on('dragend', () => {
          // Add delay before resetting drag flag
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 200); // Extra delay on mobile
        });
        
        // Optimize touch zoom behavior
        map.touchZoom.disable();
        map.touchZoom.enable();
        
        // Fix for iOS Safari scroll-bounce affecting map
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) {
              e.preventDefault();
            }
          }, { passive: false });
        }
      }
    }
  }, [onMapReady, isMobile]);
  
  // Handle map click with mobile-specific optimizations
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // On mobile, prevent clicks right after drag operations
    if (isMobile && isDraggingRef.current) {
      return;
    }
    
    // Cancel any pending click
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    // Add slight delay for mobile to better distinguish between drag and click
    if (isMobile) {
      clickTimeoutRef.current = window.setTimeout(() => {
        if (onMapClick && !isDraggingRef.current) {
          onMapClick(lat, lng);
          console.log("Map clicked, updating location to:", lat, lng);
        }
        clickTimeoutRef.current = null;
      }, 50);
    } else {
      // Desktop: execute immediately
      if (onMapClick) {
        onMapClick(lat, lng);
        console.log("Map clicked, updating location to:", lat, lng);
      }
    }
  }, [onMapClick, isMobile]);
  
  // Handle getting current user location via geolocation
  const handleGetLocation = useCallback(() => {
    if (onMapClick) {
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onMapClick(latitude, longitude);
          
          // Access the map instance and set view to the location
          if (mapRef.current) {
            const leafletMap = mapRef.current;
            leafletMap.setView([latitude, longitude], 12, {
              animate: true,
              duration: 1
            });
          }
          
          console.log("Got user position:", latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [onMapClick]);
  
  // Cleanup function to clear any pending timeouts
  const cleanup = useCallback(() => {
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  }, []);
  
  return {
    mapRef,
    handleMapReady,
    handleMapClick,
    handleGetLocation,
    cleanup
  };
};
