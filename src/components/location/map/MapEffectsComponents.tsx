
import React, { useEffect, useState, useRef, memo, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Update map view when center position changes - memoized for better performance
export const MapUpdater = memo(({ position }: { position: [number, number] }) => {
  const map = useMap();
  const lastPositionRef = useRef<[number, number]>();
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Debounced map update to prevent excessive operations
  const updateMapView = useCallback(() => {
    if (!map) return;
    
    // Check if position has changed significantly before updating
    const hasSignificantChange = !lastPositionRef.current || 
      Math.abs(lastPositionRef.current[0] - position[0]) > 0.0001 ||
      Math.abs(lastPositionRef.current[1] - position[1]) > 0.0001;
    
    if (hasSignificantChange) {
      try {
        map.setView(position, map.getZoom(), {
          animate: true,
          duration: 1,
          noMoveStart: true // Avoid triggering movestart events
        });
        lastPositionRef.current = position;
      } catch (error) {
        console.error("Error updating map view:", error);
      }
    }
  }, [map, position]);
  
  useEffect(() => {
    if (!map) return;
    
    // Clear any existing timeout
    if (updateTimeoutRef.current !== null) {
      window.clearTimeout(updateTimeoutRef.current);
    }
    
    // Set a small timeout to prevent multiple rapid updates
    updateTimeoutRef.current = window.setTimeout(() => {
      updateMapView();
      updateTimeoutRef.current = null;
    }, 50);
    
    return () => {
      if (updateTimeoutRef.current !== null) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [map, position, updateMapView]);
  
  return null;
});

// Handle map click events for editable maps - memoized for better performance
export const MapEvents = memo(({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  const clickHandlerRef = useRef<(e: L.LeafletMouseEvent) => void>();
  
  useEffect(() => {
    if (!map) return;
    
    // Create persistent click handler reference
    if (!clickHandlerRef.current) {
      clickHandlerRef.current = (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      };
    }
    
    map.on('click', clickHandlerRef.current);
    
    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
      }
    };
  }, [map, onMapClick]);
  
  return null;
});

// Apply additional dark sky overlay for certified locations - memoized for performance
export const DarkSkyOverlay = memo(({ 
  isDarkSkyReserve, 
  position,
  radiusKm = 10,
  color = '#3b82f6'
}: { 
  isDarkSkyReserve?: boolean; 
  position: [number, number];
  radiusKm?: number;
  color?: string;
}) => {
  const map = useMap();
  const [circle, setCircle] = useState<L.Circle | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const positionRef = useRef<[number, number]>(position);
  const animationFrameRef = useRef<number | null>(null);
  
  // Only update when significant parameters change
  useEffect(() => {
    if (!isDarkSkyReserve || !map) return;
    
    // Check if position has changed significantly
    const positionChanged = 
      Math.abs(positionRef.current[0] - position[0]) > 0.0001 ||
      Math.abs(positionRef.current[1] - position[1]) > 0.0001;
      
    // Use requestAnimationFrame for smooth rendering
    const updateCircle = () => {
      try {
        // Remove previous circle if it exists
        if (circle) {
          circle.remove();
        }
        
        // Convert radius from km to meters
        const radiusMeters = radiusKm * 1000;
        
        // Create a circular overlay for the dark sky region with more translucency
        const newCircle = L.circle(position, {
          radius: radiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.08, // More translucent
          weight: 1.5,
          dashArray: '5, 5',
          className: 'dark-sky-overlay'
        }).addTo(map);
        
        // Add a subtler pulsing animation effect if not already added
        if (!styleElementRef.current) {
          const pulseEffect = document.createElement('style');
          pulseEffect.innerHTML = `
            @keyframes pulse {
              0% { stroke-opacity: 0.5; stroke-width: 1.5; }
              50% { stroke-opacity: 0.2; stroke-width: 2; }
              100% { stroke-opacity: 0.5; stroke-width: 1.5; }
            }
            .dark-sky-overlay {
              animation: pulse 4s infinite;
            }
          `;
          document.head.appendChild(pulseEffect);
          styleElementRef.current = pulseEffect;
        }
        
        // Save the circle reference and position
        setCircle(newCircle);
        positionRef.current = position;
      } catch (error) {
        console.error("Error creating dark sky overlay:", error);
      }
    };
    
    if (!circle || positionChanged) {
      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Schedule update on next animation frame for better performance
      animationFrameRef.current = window.requestAnimationFrame(updateCircle);
    }
    
    return () => {
      if (circle) {
        try {
          circle.remove();
        } catch (error) {
          console.error("Error removing circle overlay:", error);
        }
      }
      
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (styleElementRef.current) {
        document.head.removeChild(styleElementRef.current);
        styleElementRef.current = null;
      }
    };
  }, [isDarkSkyReserve, position, map, radiusKm, color, circle]);
  
  return null;
});
