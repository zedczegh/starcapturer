
import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

interface RadarCircleProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showCircle: boolean;
}

/**
 * Component that renders a circle around user location with specified radius
 * Enhanced with smooth transitions and browser compatibility
 */
const RadarCircle: React.FC<RadarCircleProps> = ({ 
  userLocation, 
  searchRadius,
  showCircle
}) => {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevRadiusRef = useRef<number>(0);
  
  useEffect(() => {
    if (!userLocation) return;
    
    // Ensure we always have a radius circle showing with the animation
    const radiusInMeters = Math.max(searchRadius * 1000, 5000); // Minimum 5km for visibility
    
    // Create or update the radius circle with smooth animation
    const createOrUpdateCircle = () => {
      if (!userLocation || !showCircle) {
        // Remove circle when not needed
        if (circleRef.current) {
          circleRef.current.removeFrom(map);
          circleRef.current = null;
        }
        return;
      }

      const latLng = [userLocation.latitude, userLocation.longitude] as [number, number];
      
      // For smooth radius transition
      const animateRadius = (from: number, to: number, duration: number = 500) => {
        // Make sure the animation works on all browsers
        const startTime = Date.now();
        let requestAnimId: number;
        
        const animate = () => {
          const currentTime = Date.now();
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          
          // Ease in-out function for smoother animation
          const easeInOut = (t: number) => 
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          
          const currentRadius = from + (to - from) * easeInOut(progress);
          
          if (circleRef.current) {
            circleRef.current.setRadius(currentRadius);
          }
          
          if (progress < 1) {
            // Use standard requestAnimationFrame or setTimeout fallback for Safari
            if (typeof window !== 'undefined') {
              if ('requestAnimationFrame' in window) {
                animationRef.current = window.requestAnimationFrame(animate);
              } else {
                // Fallback for older browsers
                // Explicitly cast window to Window & typeof globalThis
                const win = window as Window & typeof globalThis;
                animationRef.current = win.setTimeout(animate, 16) as unknown as number;
              }
            }
          } else {
            animationRef.current = null;
          }
        };
        
        // Cancel any existing animation
        if (animationRef.current) {
          if (typeof window !== 'undefined') {
            if ('cancelAnimationFrame' in window) {
              window.cancelAnimationFrame(animationRef.current);
            } else {
              // Explicitly cast window to Window & typeof globalThis
              const win = window as Window & typeof globalThis;
              win.clearTimeout(animationRef.current as unknown as number);
            }
          }
          animationRef.current = null;
        }
        
        animate();
      };
      
      if (!circleRef.current) {
        // Create new circle
        circleRef.current = L.circle(
          latLng,
          {
            radius: radiusInMeters,
            color: '#3b82f6',
            fillColor: '#3b82f680',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10',
            interactive: false,
            // Improve performance on all browsers
            renderer: typeof window !== 'undefined' && window.L && window.L.canvas ? window.L.canvas() : undefined,
          }
        ).addTo(map);
        
        console.log(`Created circle with radius: ${radiusInMeters}m`);
        prevRadiusRef.current = radiusInMeters;
      } else {
        // Update circle position
        circleRef.current.setLatLng(latLng);
        
        // Animate the radius change if it's different
        if (Math.abs(prevRadiusRef.current - radiusInMeters) > 10) {
          animateRadius(prevRadiusRef.current, radiusInMeters);
          prevRadiusRef.current = radiusInMeters;
          console.log(`Animating circle radius to: ${radiusInMeters}m`);
        }
      }
    };
    
    createOrUpdateCircle();
    
    // Update circle on map move/zoom
    const handleMapChange = () => {
      createOrUpdateCircle();
    };
    
    map.on('zoom', handleMapChange);
    map.on('move', handleMapChange);
    
    // Clean up
    return () => {
      map.off('zoom', handleMapChange);
      map.off('move', handleMapChange);
      
      if (animationRef.current) {
        if (typeof window !== 'undefined') {
          if ('cancelAnimationFrame' in window) {
            window.cancelAnimationFrame(animationRef.current);
          } else {
            // Explicitly cast window to Window & typeof globalThis
            const win = window as Window & typeof globalThis;
            win.clearTimeout(animationRef.current as unknown as number);
          }
        }
        animationRef.current = null;
      }
      
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
    };
  }, [map, userLocation, searchRadius, showCircle]);
  
  return null;
};

export default RadarCircle;
