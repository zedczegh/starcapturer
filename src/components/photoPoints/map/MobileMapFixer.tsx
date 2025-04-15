
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Component to apply mobile-specific fixes for common map issues
 * - Fixes marker positioning during zoom/pan
 * - Improves touch responsiveness
 * - Fixes iOS Safari rendering issues
 */
export const MobileMapFixer: React.FC = () => {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map || !isMobile) return;
    
    // Fix for marker positioning issues during zoom
    const fixMarkerPositioning = () => {
      if (!map._panes) return;
      
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
        }, 200);
      }
    };
    
    // Re-render markers after zoom to fix positions
    map.on('zoomanim', fixMarkerPositioning);
    map.on('zoomend', fixMarkerPositioning);
    map.on('moveend', fixMarkerPositioning);
    
    // iOS Safari specific fixes
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      // Fix flickering tiles on iOS
      const tilePane = map._panes.tilePane;
      if (tilePane) {
        tilePane.style.webkitBackfaceVisibility = 'hidden';
      }
      
      // Fix for sticky touches on iOS
      map.getContainer().addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          // Prevent page from scrolling
          e.preventDefault();
        }
      }, { passive: false });
      
      // Fix for markers not appearing after zoom on iOS
      map.on('zoom', () => {
        if (map._panes.markerPane) {
          // Toggle visibility to force iOS to redraw markers
          map._panes.markerPane.style.display = 'none';
          setTimeout(() => {
            if (map._panes.markerPane) {
              map._panes.markerPane.style.display = '';
            }
          }, 10);
        }
      });
    }
    
    // Configure interaction settings
    if (map.options) {
      // Enable double click zoom but make it center on the clicked point
      map.doubleClickZoom.enable();
      
      // Add touch-specific settings
      if (map.tap) {
        map.tap.disable();
        map.tap.enable();
      }
      
      // Add proper zoom controls
      if (!map.zoomControl) {
        map.addControl(L.control.zoom({ position: 'bottomright' }));
      }
    }
    
    // Apply the initial fixes
    fixMarkerPositioning();
    
    return () => {
      // Clean up event listeners
      map.off('zoomanim', fixMarkerPositioning);
      map.off('zoomend', fixMarkerPositioning);
      map.off('moveend', fixMarkerPositioning);
      map.off('zoom');
    };
  }, [map, isMobile]);
  
  return null;
};

export default MobileMapFixer;
