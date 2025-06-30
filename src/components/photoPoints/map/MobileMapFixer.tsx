
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Enhanced mobile map optimization component
 * Fixes common mobile issues and improves performance
 */
export const MobileMapFixer: React.FC = () => {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map || !isMobile) return;
    
    // Performance optimization: reduce tile loading on mobile
    const optimizeMapPerformance = () => {
      try {
        // Adjust tile layer settings for mobile
        map.eachLayer((layer) => {
          if (layer instanceof L.TileLayer) {
            // Reduce concurrent tile loading on mobile
            (layer as any).options.updateWhenIdle = true;
            (layer as any).options.updateWhenZooming = false;
            (layer as any).options.keepBuffer = 1;
          }
        });
        
        // Disable double-click zoom on mobile (can interfere with touch)
        map.doubleClickZoom.disable();
        
        // Optimize touch interactions
        if (map.touchZoom) {
          map.touchZoom.disable();
          map.touchZoom.enable({ pinch: true });
        }
        
        // Improve drag performance on mobile
        if (map.dragging) {
          map.dragging.disable();
          map.dragging.enable();
        }
        
      } catch (error) {
        console.warn('Error optimizing map performance:', error);
      }
    };
    
    // Fix marker positioning issues during zoom/pan
    const fixMarkerPositioning = () => {
      if (!map._panes) return;
      
      try {
        const markerPane = map._panes.markerPane;
        if (markerPane) {
          // Apply hardware acceleration
          markerPane.style.willChange = 'transform';
          markerPane.style.transform = 'translate3d(0,0,0)';
          
          // Force repaint with optimized timing
          requestAnimationFrame(() => {
            if (markerPane) {
              const currentZIndex = parseInt(markerPane.style.zIndex || '600');
              markerPane.style.zIndex = String(currentZIndex + 1);
              
              setTimeout(() => {
                if (markerPane) {
                  markerPane.style.zIndex = '600';
                }
              }, 16); // One frame delay
            }
          });
        }
      } catch (error) {
        console.warn('Error fixing marker positioning:', error);
      }
    };
    
    // Ensure proper map sizing and prevent layout issues
    const ensureMapSize = () => {
      try {
        // Use animation frame for smoother size calculation
        requestAnimationFrame(() => {
          map.invalidateSize({ animate: false, pan: false });
          
          const container = map.getContainer();
          if (container && (container.clientWidth === 0 || container.clientHeight === 0)) {
            console.warn('Map container has invalid dimensions');
            
            // Retry after a short delay
            setTimeout(() => {
              map.invalidateSize({ animate: false, pan: false });
            }, 100);
          }
        });
      } catch (error) {
        console.warn('Error ensuring map size:', error);
      }
    };
    
    // iOS-specific optimizations
    const applyIOSOptimizations = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        try {
          // Fix tile flickering on iOS
          const tilePane = map._panes.tilePane;
          if (tilePane) {
            tilePane.style.webkitBackfaceVisibility = 'hidden';
            tilePane.style.webkitTransform = 'translate3d(0,0,0)';
          }
          
          // iOS zoom fix
          map.on('zoom', () => {
            try {
              if (map._panes && map._panes.markerPane) {
                const markerPane = map._panes.markerPane;
                markerPane.style.display = 'none';
                
                // Use requestAnimationFrame for smoother restoration
                requestAnimationFrame(() => {
                  if (markerPane) {
                    markerPane.style.display = '';
                  }
                });
              }
            } catch (error) {
              console.warn('Error in iOS zoom fix:', error);
            }
          });
          
        } catch (error) {
          console.warn('Error applying iOS optimizations:', error);
        }
      }
    };
    
    // Initialize all optimizations
    const initializeOptimizations = () => {
      optimizeMapPerformance();
      ensureMapSize();
      applyIOSOptimizations();
      fixMarkerPositioning();
    };
    
    // Run initial optimizations
    initializeOptimizations();
    
    // Set up event listeners with optimized handlers
    map.on('zoomanim', fixMarkerPositioning);
    map.on('zoomend', fixMarkerPositioning);
    map.on('moveend', fixMarkerPositioning);
    map.on('resize', ensureMapSize);
    
    // Periodic size check for dynamic layouts
    const sizeCheckInterval = setInterval(() => {
      ensureMapSize();
    }, 2000);
    
    // Cleanup function
    return () => {
      map.off('zoomanim', fixMarkerPositioning);
      map.off('zoomend', fixMarkerPositioning);
      map.off('moveend', fixMarkerPositioning);
      map.off('resize', ensureMapSize);
      map.off('zoom'); // Remove iOS-specific zoom handler
      
      clearInterval(sizeCheckInterval);
    };
  }, [map, isMobile]);
  
  return null;
};

export default MobileMapFixer;
