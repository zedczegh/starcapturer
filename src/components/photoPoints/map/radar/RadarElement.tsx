
import React, { useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface RadarElementProps {
  radarStyles: {
    size: number;
    left: number;
    top: number;
  } | null;
  showAnimation: boolean;
}

/**
 * Component that renders the actual radar sweep animation element
 */
const RadarElement: React.FC<RadarElementProps> = ({ 
  radarStyles,
  showAnimation
}) => {
  const map = useMap();
  const radarRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevPositionRef = useRef<{left: number, top: number} | null>(null);
  
  useEffect(() => {
    if (!showAnimation || !radarStyles) {
      // Clean up when animation is not shown
      if (containerRef.current && containerRef.current.parentElement) {
        containerRef.current.parentElement.removeChild(containerRef.current);
        containerRef.current = null;
        radarRef.current = null;
      }
      return;
    }
    
    // Create radar element if it doesn't exist
    if (!radarRef.current) {
      // Create radar DOM element manually
      const radar = document.createElement('div');
      radar.className = 'radar-sweep';
      
      // Add to map container directly
      const mapContainer = map.getContainer();
      if (mapContainer) {
        const container = document.createElement('div');
        container.className = 'radar-container';
        container.style.position = 'absolute';
        container.appendChild(radar);
        mapContainer.appendChild(container);
        
        radarRef.current = radar;
        containerRef.current = container;
      }
    }
    
    // Update radar position and size
    if (radarRef.current && radarStyles) {
      const previousPosition = prevPositionRef.current;
      
      // Set initial size
      radarRef.current.style.width = `${radarStyles.size}px`;
      radarRef.current.style.height = `${radarStyles.size}px`;
      
      // If this is a position update, handle the transition
      if (previousPosition && 
          (Math.abs(previousPosition.left - radarStyles.left) > 5 || 
           Math.abs(previousPosition.top - radarStyles.top) > 5)) {
        
        // For location changes, reset the animation to start from center
        radarRef.current.style.opacity = '0';
        radarRef.current.style.transition = 'opacity 0.2s ease-out';
        
        // Position immediately at new location
        // Precisely center the radar on the marker by using transform
        radarRef.current.style.left = `${radarStyles.left}px`;
        radarRef.current.style.top = `${radarStyles.top}px`;
        radarRef.current.style.transformOrigin = 'center center';
        
        // Fade in at new location after position is set
        requestAnimationFrame(() => {
          if (radarRef.current) {
            radarRef.current.style.opacity = '1';
            
            // Reset rotation to make it feel more like a new start
            radarRef.current.style.animationName = 'none';
            
            requestAnimationFrame(() => {
              if (radarRef.current) {
                radarRef.current.style.animationName = '';
              }
            });
          }
        });
      } else {
        // Normal position update without transition effect
        // Precisely center the radar
        radarRef.current.style.left = `${radarStyles.left}px`;
        radarRef.current.style.top = `${radarStyles.top}px`;
        radarRef.current.style.transformOrigin = 'center center';
        radarRef.current.style.opacity = '1';
      }
      
      // Apply hardware acceleration for smoother animations
      radarRef.current.style.transform = 'translate3d(0,0,0)';
      radarRef.current.style.backfaceVisibility = 'hidden';
      
      // Save current position for next comparison
      prevPositionRef.current = {
        left: radarStyles.left,
        top: radarStyles.top
      };
    }
    
    // Cleanup
    return () => {
      if (containerRef.current && containerRef.current.parentElement) {
        containerRef.current.parentElement.removeChild(containerRef.current);
        containerRef.current = null;
        radarRef.current = null;
      }
    };
  }, [map, radarStyles, showAnimation]);
  
  return null;
};

export default RadarElement;
