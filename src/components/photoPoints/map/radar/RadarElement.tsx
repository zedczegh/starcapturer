
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
      radarRef.current.style.width = `${radarStyles.size}px`;
      radarRef.current.style.height = `${radarStyles.size}px`;
      radarRef.current.style.left = `${radarStyles.left}px`;
      radarRef.current.style.top = `${radarStyles.top}px`;
      
      // Apply hardware acceleration for smoother animations
      radarRef.current.style.transform = 'translate3d(0,0,0)';
      radarRef.current.style.backfaceVisibility = 'hidden';
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
