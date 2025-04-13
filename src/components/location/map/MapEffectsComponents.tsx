
import React, { useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Component to update map view when center position changes
 */
export function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      // Smoother animation on mobile
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: isMobile ? 0.5 : 1 // Faster animation on mobile
      });
    } catch (error) {
      console.error("Error updating map view:", error);
    }
  }, [map, position, isMobile]);
  
  return null;
}

/**
 * Component to handle map click events for editable maps
 * Enhanced for better mobile touch handling
 */
export function MapEvents({ 
  onMapClick,
  onMapDragStart,
  onMapDragEnd,
  onMapZoomEnd
}: { 
  onMapClick: (lat: number, lng: number) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
  onMapZoomEnd?: () => void;
}) {
  const map = useMap();
  const isMobile = useIsMobile();
  
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);
  
  useEffect(() => {
    if (!map) return;
    
    let clickTimeout: number | null = null;
    let isDragging = false;
    let dragThreshold = 0; // Counter for drag detection
    let lastTouch: { x: number, y: number } | null = null;
    
    // Handle standard click events
    map.on('click', handleMapClick);
    
    // Enhanced drag events with callbacks
    if (onMapDragStart) {
      map.on('dragstart', () => {
        isDragging = true;
        onMapDragStart();
        
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
          clickTimeout = null;
        }
      });
    } else {
      map.on('dragstart', () => {
        isDragging = true;
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
          clickTimeout = null;
        }
      });
    }
    
    if (onMapDragEnd) {
      map.on('dragend', () => {
        // Add small delay before allowing clicks again
        setTimeout(() => {
          isDragging = false;
          dragThreshold = 0;
          onMapDragEnd();
        }, 50);
      });
    } else {
      map.on('dragend', () => {
        // Add small delay before allowing clicks again
        setTimeout(() => {
          isDragging = false;
          dragThreshold = 0;
        }, 50);
      });
    }
    
    // Handle zoom end events
    if (onMapZoomEnd) {
      map.on('zoomend', onMapZoomEnd);
    }
    
    // Enhanced mobile-specific handling
    if (isMobile) {
      // Replace standard click with a custom handler for mobile
      map.off('click', handleMapClick);
      
      // Improved touch detection
      map.getContainer().addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches && e.touches[0]) {
          lastTouch = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      }, { passive: false });
      
      // Track touch movement to better detect drags
      map.getContainer().addEventListener('touchmove', (e: TouchEvent) => {
        if (lastTouch && e.touches && e.touches[0]) {
          const dx = Math.abs(e.touches[0].clientX - lastTouch.x);
          const dy = Math.abs(e.touches[0].clientY - lastTouch.y);
          
          if (dx > 5 || dy > 5) {
            dragThreshold++;
            if (dragThreshold > 3) {
              isDragging = true;
            }
          }
        }
      }, { passive: false });
      
      // Use a tap handler with better precision for mobile
      map.on('tap', (e: any) => {
        if (isDragging || dragThreshold > 3) {
          dragThreshold = 0;
          return;
        }
        
        // Reset drag detection
        dragThreshold = 0;
        
        // Slight delay to ensure it's not part of a drag
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
        }
        
        clickTimeout = window.setTimeout(() => {
          handleMapClick(e);
        }, 50);
      });
    }
    
    return () => {
      map.off('click', handleMapClick);
      if (onMapDragStart) map.off('dragstart');
      if (onMapDragEnd) map.off('dragend');
      if (onMapZoomEnd) map.off('zoomend');
      
      if (isMobile) {
        map.off('tap');
        map.getContainer().removeEventListener('touchstart', () => {});
        map.getContainer().removeEventListener('touchmove', () => {});
      }
      
      if (clickTimeout !== null) {
        window.clearTimeout(clickTimeout);
      }
    };
  }, [map, handleMapClick, isMobile, onMapDragStart, onMapDragEnd, onMapZoomEnd]);
  
  return null;
}

/**
 * Component to apply additional dark sky overlay for certified locations
 */
export function DarkSkyOverlay({ 
  isDarkSkyReserve, 
  position 
}: { 
  isDarkSkyReserve?: boolean; 
  position: [number, number];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!isDarkSkyReserve || !map) return;
    
    // Create a circular overlay for the dark sky region
    const circle = L.circle(position, {
      radius: 10000, // 10km radius
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);
    
    return () => {
      if (circle) {
        try {
          circle.remove();
        } catch (error) {
          console.error("Error removing circle overlay:", error);
        }
      }
    };
  }, [isDarkSkyReserve, position, map]);
  
  return null;
}

/**
 * Component to handle map interactivity settings
 * Enhanced for mobile devices
 */
export function MapInteractionManager({
  draggable = true,
  zoomable = true,
  onReady
}: {
  draggable?: boolean;
  zoomable?: boolean;
  onReady?: () => void;
}) {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    // Set dragging state with mobile optimizations
    if (draggable) {
      map.dragging.enable();
      
      // Apply mobile-specific dragging settings
      if (isMobile && map.dragging._draggable) {
        // Improve mobile dragging by adjusting inertia settings
        map.dragging._draggable._inertia = true;
        map.dragging._draggable.options.inertia = {
          deceleration: 2800,  // Adjusted for smoother stops
          maxSpeed: 1300,      // Reduced for better control
          timeThreshold: 150,  // Increased for more consistent behavior
          linearity: 0.3       // Adjusted for smoother deceleration
        };
      }
    } else {
      map.dragging.disable();
    }
    
    // Set zoom state with mobile optimizations
    if (zoomable) {
      if (isMobile) {
        // Ensure touch zoom is properly configured
        map.touchZoom.disable();
        map.touchZoom.enable();
        
        // Enable double click zoom but with optimized settings
        map.doubleClickZoom.disable();
        map.doubleClickZoom.enable();
        
        // Set touch zoom to center for better mobile experience
        // @ts-ignore - This property exists but is not in the type definitions
        if (map.options) {
          map.options.touchZoom = 'center';
        }
        
        // Fix pinch zoom on iOS Safari
        const mapPane = map.getPane('mapPane');
        if (mapPane) {
          mapPane.style.willChange = 'transform';
          mapPane.style.transform = 'translate3d(0, 0, 0)';
        }
      } else {
        map.scrollWheelZoom.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
      }
    } else {
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
    }
    
    // Improve map panning performance with hardware acceleration
    if (map._mapPane) {
      map._mapPane.style.willChange = 'transform';
      map._mapPane.style.backfaceVisibility = 'hidden';
    }
    
    // Reduce tile fade animation on mobile for better performance
    if (isMobile) {
      const tilePane = map.getPane('tilePane');
      if (tilePane) {
        tilePane.className = tilePane.className + ' mobile-optimized';
        document.head.insertAdjacentHTML('beforeend', `
          <style>
            .mobile-optimized .leaflet-tile-loaded {
              transition: opacity 0.1s;
            }
          </style>
        `);
      }
    }
    
    // Call onReady callback if provided
    if (onReady) {
      onReady();
    }
    
    return () => {
      // Clean up
      if (map._mapPane) {
        map._mapPane.style.willChange = 'auto';
        map._mapPane.style.backfaceVisibility = 'visible';
      }
    };
  }, [map, draggable, zoomable, onReady, isMobile]);
  
  return null;
}
