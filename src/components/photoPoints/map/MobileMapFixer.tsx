
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Component to apply mobile-specific fixes for common map issues
 * - Fixes marker positioning during zoom/pan
 * - Improves touch responsiveness
 * - Fixes iOS Safari rendering issues
 * - Handles _leaflet_pos errors
 */
export const MobileMapFixer: React.FC = () => {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map || !isMobile) return;
    
    // Fix for marker positioning issues during zoom
    const fixMarkerPositioning = () => {
      if (!map._panes) return;
      
      try {
        // Apply hardware acceleration to marker pane
        const markerPane = map._panes.markerPane;
        if (markerPane) {
          markerPane.style.willChange = 'transform';
          markerPane.style.transform = 'translate3d(0,0,0)';
          
          // Force a repaint to fix positioning
          setTimeout(() => {
            if (markerPane) {
              // Toggle a property to force a repaint
              markerPane.style.zIndex = String(parseInt(markerPane.style.zIndex || '600') + 1);
              setTimeout(() => {
                if (markerPane) {
                  markerPane.style.zIndex = '600';
                }
              }, 10);
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error fixing marker positioning:", error);
      }
    };
    
    // Ensure map is properly sized to prevent _leaflet_pos errors
    const ensureMapSize = () => {
      try {
        // Force the map to recalculate its dimensions
        map.invalidateSize({ animate: false, pan: false });
        
        // Check if container size is valid
        const container = map.getContainer();
        if (container && (container.clientWidth === 0 || container.clientHeight === 0)) {
          console.warn("Map container has zero width or height");
          
          // Try again after a delay
          setTimeout(() => map.invalidateSize(), 200);
        }
      } catch (error) {
        console.error("Error ensuring map size:", error);
      }
    };
    
    // Run size check on initialization
    ensureMapSize();
    
    // Re-render markers after zoom to fix positions
    map.on('zoomanim', fixMarkerPositioning);
    map.on('zoomend', fixMarkerPositioning);
    map.on('moveend', fixMarkerPositioning);
    map.on('resize', ensureMapSize);
    
    // iOS Safari specific fixes
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      // Fix flickering tiles on iOS
      try {
        const tilePane = map._panes.tilePane;
        if (tilePane) {
          tilePane.style.webkitBackfaceVisibility = 'hidden';
        }
      } catch (error) {
        console.error("Error applying iOS tile pane fix:", error);
      }
      
      // Fix for markers not appearing after zoom on iOS
      map.on('zoom', () => {
        try {
          if (map._panes && map._panes.markerPane) {
            // Toggle visibility to force iOS to redraw markers
            map._panes.markerPane.style.display = 'none';
            setTimeout(() => {
              if (map._panes.markerPane) {
                map._panes.markerPane.style.display = '';
              }
            }, 10);
          }
        } catch (error) {
          console.error("Error handling iOS zoom fix:", error);
        }
      });
    }
    
    // Apply the initial fixes
    fixMarkerPositioning();
    
    // Periodically check map size in case container resizes
    const sizeInterval = setInterval(ensureMapSize, 2000);
    
    return () => {
      // Clean up event listeners
      map.off('zoomanim', fixMarkerPositioning);
      map.off('zoomend', fixMarkerPositioning);
      map.off('moveend', fixMarkerPositioning);
      map.off('resize', ensureMapSize);
      map.off('zoom');
      
      // Clear interval
      clearInterval(sizeInterval);
    };
  }, [map, isMobile]);
  
  return null;
};

export default MobileMapFixer;
