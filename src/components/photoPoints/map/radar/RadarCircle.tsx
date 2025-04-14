
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface RadarCircleProps {
  userLocation: { latitude: number; longitude: number };
  searchRadius: number;
  showCircle: boolean;
  locationChanged?: boolean;
}

/**
 * Component that renders a circle around the user location to show search radius
 */
const RadarCircle: React.FC<RadarCircleProps> = ({
  userLocation,
  searchRadius,
  showCircle,
  locationChanged = false
}) => {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  
  // Helper to create circle with proper styling
  const createCircle = useCallback(() => {
    if (!userLocation || !map) return null;
    
    // Create with proper radius (searchRadius is in km, L.circle uses meters)
    // Create the circle exactly centered on the user location
    const latlng = L.latLng(userLocation.latitude, userLocation.longitude);
    
    const circle = L.circle(latlng, {
      radius: searchRadius * 1000, // Convert km to meters
      color: '#0ea5e9', // Sky blue
      fillColor: '#0ea5e9',
      fillOpacity: 0.05,
      weight: 1.5,
      opacity: 0.7,
      className: 'radar-circle'
    });
    
    // Add CSS for smooth transitions
    if (!document.getElementById('radar-circle-style')) {
      const style = document.createElement('style');
      style.id = 'radar-circle-style';
      style.innerHTML = `
        .radar-circle {
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
          transform-origin: center center !important;
        }
        
        .radar-circle-pulse {
          animation: radar-circle-pulse 2s ease-out 1;
        }
        
        @keyframes radar-circle-pulse {
          0% {
            stroke-opacity: 0.3;
            stroke-width: 1;
            transform: scale(0.8);
          }
          50% {
            stroke-opacity: 0.8;
            stroke-width: 2;
          }
          100% {
            stroke-opacity: 0.7;
            stroke-width: 1.5;
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return circle;
  }, [map, searchRadius, userLocation]);
  
  // Handle circle lifecycle
  useEffect(() => {
    // Only create/show circle when requested
    if (!showCircle) {
      // Hide the circle
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
      setVisible(false);
      return;
    }
    
    // Create or update circle
    if (!circleRef.current) {
      const circle = createCircle();
      if (circle) {
        // Add to map
        circle.addTo(map);
        circleRef.current = circle;
        
        // Start with 0 opacity and animate in
        const pathElement = circle.getElement();
        if (pathElement) {
          pathElement.style.opacity = '0';
          
          // Animate in
          window.setTimeout(() => {
            if (pathElement) {
              pathElement.style.opacity = '1';
              // Add pulse animation class
              pathElement.classList.add('radar-circle-pulse');
              
              // Remove class after animation completes
              animationTimeoutRef.current = window.setTimeout(() => {
                pathElement.classList.remove('radar-circle-pulse');
              }, 2000);
            }
          }, 100);
        }
        
        setVisible(true);
      }
    } else {
      // Update existing circle
      if (locationChanged) {
        // Handle location change
        const newCircle = createCircle();
        if (newCircle) {
          // Remove old circle
          circleRef.current.removeFrom(map);
          
          // Add new circle
          newCircle.addTo(map);
          circleRef.current = newCircle;
          
          // Add animation for location change
          const pathElement = newCircle.getElement();
          if (pathElement) {
            pathElement.style.opacity = '0';
            
            // Animate in
            window.setTimeout(() => {
              if (pathElement) {
                pathElement.style.opacity = '1';
                // Add pulse animation class
                pathElement.classList.add('radar-circle-pulse');
                
                // Remove class after animation completes
                if (animationTimeoutRef.current !== null) {
                  window.clearTimeout(animationTimeoutRef.current);
                }
                
                animationTimeoutRef.current = window.setTimeout(() => {
                  pathElement.classList.remove('radar-circle-pulse');
                }, 2000);
              }
            }, 100);
          }
        }
      } else {
        // Just update position and radius - ensure exact center positioning
        circleRef.current.setLatLng(L.latLng(userLocation.latitude, userLocation.longitude));
        circleRef.current.setRadius(searchRadius * 1000);
      }
    }
    
    return () => {
      // Clean up timeouts
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [map, createCircle, showCircle, userLocation, searchRadius, locationChanged]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
      
      // Clean up style element
      const styleElement = document.getElementById('radar-circle-style');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
      
      // Clean up timeouts
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [map]);
  
  return null;
};

export default RadarCircle;
