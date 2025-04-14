
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
        }, 100); // Increased from 50ms to 100ms for mobile
      });
    } else {
      map.on('dragend', () => {
        // Add small delay before allowing clicks again
        setTimeout(() => {
          isDragging = false;
          dragThreshold = 0;
        }, 100); // Increased from 50ms to 100ms for mobile
      });
    }
    
    // Handle zoom end events with improved stability
    if (onMapZoomEnd) {
      map.on('zoomend', () => {
        // Ensure markers are positioned correctly after zoom
        requestAnimationFrame(() => {
          if (map && map._panes && map._panes.markerPane) {
            // Force GPU acceleration for marker repositioning
            map._panes.markerPane.style.transform = 'translate3d(0,0,0)';
          }
          onMapZoomEnd();
        });
      });
    } else {
      map.on('zoomend', () => {
        // Ensure markers are positioned correctly after zoom
        if (map && map._panes && map._panes.markerPane) {
          map._panes.markerPane.style.transform = 'translate3d(0,0,0)';
        }
      });
    }
    
    // Enhanced mobile-specific handling
    if (isMobile) {
      // Fix for iOS Safari issues with markers during zoom
      map.on('zoomanim', (e: any) => {
        if (map && map._panes) {
          // Apply hardware acceleration to all panes
          for (const pane in map._panes) {
            if (map._panes[pane].style) {
              map._panes[pane].style.willChange = 'transform';
              map._panes[pane].style.backfaceVisibility = 'hidden';
            }
          }
        }
      });
      
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
        }, 100); // Increased from 50ms to 100ms for better reliability
      });
      
      // Add special handler for fixing marker positioning on mobile
      map.on('moveend', () => {
        if (map && map._panes && map._panes.markerPane) {
          // Force repaint of markers to fix positioning issues
          requestAnimationFrame(() => {
            map._panes.markerPane.style.transform = 'translate3d(0,0,0)';
            setTimeout(() => {
              if (map._panes.markerPane) {
                map._panes.markerPane.style.transform = '';
              }
            }, 10);
          });
        }
      });
    }
    
    return () => {
      map.off('click', handleMapClick);
      map.off('zoomend');
      map.off('moveend');
      if (onMapDragStart) map.off('dragstart');
      if (onMapDragEnd) map.off('dragend');
      
      if (isMobile) {
        map.off('tap');
        map.off('zoomanim');
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
          deceleration: 2200,  // Adjusted for smoother stops (was 2800)
          maxSpeed: 1500,      // Increased for more responsive feel (was 1300)
          timeThreshold: 100,  // Lower for faster response (was 150)
          linearity: 0.25      // Adjusted for smoother deceleration (was 0.3)
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
        
        // Apply better pinch-to-zoom settings for mobile
        if (map.options) {
          // @ts-ignore - These properties exist but are not in the type definitions
          map.options.touchZoom = 'center';  // Zoom to center for more predictable behavior
          map.options.bounceAtZoomLimits = false; // Prevent bounce for smoother experience
        }
        
        // Enable double click zoom but with optimized settings
        map.doubleClickZoom.disable();
        map.doubleClickZoom.enable();
        
        // Fix pinch zoom on iOS Safari
        const mapPane = map.getPane('mapPane');
        if (mapPane) {
          mapPane.style.willChange = 'transform';
          mapPane.style.transform = 'translate3d(0, 0, 0)';
          mapPane.style.transformOrigin = '0 0';
          mapPane.style.backfaceVisibility = 'hidden';
        }
        
        // Fix marker pane for better mobile performance
        const markerPane = map.getPane('markerPane');
        if (markerPane) {
          markerPane.style.willChange = 'transform';
          markerPane.style.transform = 'translate3d(0, 0, 0)';
          markerPane.style.transformOrigin = '0 0';
          markerPane.style.backfaceVisibility = 'hidden';
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
      
      // Apply GPU acceleration to all panes
      for (const key in map._panes) {
        if (map._panes[key] && map._panes[key].style) {
          map._panes[key].style.willChange = 'transform';
          map._panes[key].style.backfaceVisibility = 'hidden';
        }
      }
    }
    
    // Reduce tile fade animation on mobile for better performance
    if (isMobile) {
      const tilePane = map.getPane('tilePane');
      if (tilePane) {
        tilePane.className = tilePane.className + ' mobile-optimized';
        
        // Add CSS directly to head for mobile optimization
        if (!document.getElementById('leaflet-mobile-styles')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'leaflet-mobile-styles';
          styleEl.textContent = `
            .mobile-optimized .leaflet-tile-loaded {
              transition: opacity 0.1s !important;
            }
            .leaflet-marker-icon {
              transform-origin: bottom center !important;
            }
            .leaflet-touch .leaflet-control-zoom a {
              width: 36px !important;
              height: 36px !important;
              line-height: 36px !important;
              font-size: 18px !important;
            }
          `;
          document.head.appendChild(styleEl);
        }
      }
      
      // Fix common iOS Safari issues with fixed positioning
      map._container.style.width = '100%';
      map._container.style.height = '100%';
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
      
      // Remove mobile-specific CSS
      const mobileStyles = document.getElementById('leaflet-mobile-styles');
      if (mobileStyles) {
        mobileStyles.remove();
      }
    };
  }, [map, draggable, zoomable, onReady, isMobile]);
  
  return null;
}
