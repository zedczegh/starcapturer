
import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './RadarAnimation.css';

interface RadarCircleProps {
  center: [number, number];
  radiusInKm: number;
  isSearching: boolean;
  color: string;
}

const RadarCircle: React.FC<RadarCircleProps> = ({ 
  center, 
  radiusInKm, 
  isSearching, 
  color 
}) => {
  const map = useMap();
  const [radarElement, setRadarElement] = useState<L.SVGOverlay | null>(null);
  
  // Clean up previous radar elements when component unmounts
  useEffect(() => {
    return () => {
      if (radarElement) {
        radarElement.remove();
      }
    };
  }, [radarElement]);
  
  // Create or update radar effect
  useEffect(() => {
    if (!isSearching || !center || !radiusInKm) {
      if (radarElement) {
        radarElement.remove();
        setRadarElement(null);
      }
      return;
    }
    
    // Convert km radius to pixels based on current zoom
    const radiusInMeters = radiusInKm * 1000;
    const point = map.latLngToLayerPoint(L.latLng(center[0], center[1]));
    
    // Calculate bounds for SVG overlay (2x radius for safety)
    const bounds = L.latLngBounds(
      map.layerPointToLatLng([point.x - radiusInMeters, point.y - radiusInMeters]),
      map.layerPointToLatLng([point.x + radiusInMeters, point.y + radiusInMeters])
    );
    
    // Create SVG element with radar effect
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgElement.setAttribute("viewBox", `0 0 ${radiusInMeters * 2} ${radiusInMeters * 2}`);
    svgElement.setAttribute("width", `${radiusInMeters * 2}px`);
    svgElement.setAttribute("height", `${radiusInMeters * 2}px`);
    svgElement.style.position = "absolute";
    svgElement.style.overflow = "visible";
    
    // Add gradient definitions
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Create radial gradient
    const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    radialGradient.setAttribute("id", "radarGradient");
    radialGradient.setAttribute("cx", "50%");
    radialGradient.setAttribute("cy", "50%");
    radialGradient.setAttribute("r", "50%");
    
    const stopInner = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopInner.setAttribute("offset", "0%");
    stopInner.setAttribute("stop-color", color);
    stopInner.setAttribute("stop-opacity", "0.2");
    
    const stopOuter = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopOuter.setAttribute("offset", "100%");
    stopOuter.setAttribute("stop-color", color);
    stopOuter.setAttribute("stop-opacity", "0");
    
    radialGradient.appendChild(stopInner);
    radialGradient.appendChild(stopOuter);
    defs.appendChild(radialGradient);
    svgElement.appendChild(defs);
    
    // Add main circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", `${radiusInMeters}`);
    circle.setAttribute("cy", `${radiusInMeters}`);
    circle.setAttribute("r", `${radiusInMeters}`);
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", "2");
    circle.setAttribute("fill", "url(#radarGradient)");
    circle.setAttribute("stroke-dasharray", "10, 10");
    circle.setAttribute("class", "radar-circle");
    svgElement.appendChild(circle);
    
    // Add inner circle for reference
    const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    innerCircle.setAttribute("cx", `${radiusInMeters}`);
    innerCircle.setAttribute("cy", `${radiusInMeters}`);
    innerCircle.setAttribute("r", `${radiusInMeters / 2}`);
    innerCircle.setAttribute("stroke", color);
    innerCircle.setAttribute("stroke-width", "1");
    innerCircle.setAttribute("fill", "none");
    innerCircle.setAttribute("stroke-dasharray", "5, 5");
    svgElement.appendChild(innerCircle);
    
    // Add sweeping line
    const sweepGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    sweepGroup.setAttribute("class", "radar-sweep");
    
    const sweepLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    sweepLine.setAttribute("x1", `${radiusInMeters}`);
    sweepLine.setAttribute("y1", `${radiusInMeters}`);
    sweepLine.setAttribute("x2", `${radiusInMeters}`);
    sweepLine.setAttribute("y2", "0");
    sweepLine.setAttribute("stroke", color);
    sweepLine.setAttribute("stroke-width", "2");
    
    const sweepGradient = document.createElementNS("http://www.w3.org/2000/svg", "path");
    sweepGradient.setAttribute("d", `M ${radiusInMeters} ${radiusInMeters} L ${radiusInMeters} 0 A ${radiusInMeters} ${radiusInMeters} 0 0 1 ${radiusInMeters * 1.5} ${radiusInMeters * 0.5} z`);
    sweepGradient.setAttribute("fill", color);
    sweepGradient.setAttribute("fill-opacity", "0.4");
    
    sweepGroup.appendChild(sweepGradient);
    sweepGroup.appendChild(sweepLine);
    svgElement.appendChild(sweepGroup);
    
    // Add random spots to simulate radar detection
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radiusInMeters;
      const x = radiusInMeters + Math.cos(angle) * distance;
      const y = radiusInMeters + Math.sin(angle) * distance;
      
      const spot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      spot.setAttribute("cx", `${x}`);
      spot.setAttribute("cy", `${y}`);
      spot.setAttribute("r", "3");
      spot.setAttribute("fill", "#F2FCE2");
      spot.style.opacity = `${0.3 + Math.random() * 0.7}`;
      spot.style.animation = `radarSpotPulse ${1 + Math.random() * 2}s ease-in-out infinite`;
      svgElement.appendChild(spot);
    }
    
    // Clean up previous overlay if exists
    if (radarElement) {
      radarElement.remove();
    }
    
    // Create new overlay with SVG element
    const overlay = L.svgOverlay(svgElement, bounds, {
      interactive: false,
      bubblingMouseEvents: true,
      pane: 'overlayPane'
    }).addTo(map);
    
    setRadarElement(overlay);
    
    // Update position when map is moved/zoomed
    const updatePosition = () => {
      if (overlay && map) {
        const newPoint = map.latLngToLayerPoint(L.latLng(center[0], center[1]));
        const newBounds = L.latLngBounds(
          map.layerPointToLatLng([newPoint.x - radiusInMeters, newPoint.y - radiusInMeters]),
          map.layerPointToLatLng([newPoint.x + radiusInMeters, newPoint.y + radiusInMeters])
        );
        overlay.setBounds(newBounds);
      }
    };
    
    map.on('zoom', updatePosition);
    map.on('move', updatePosition);
    
    return () => {
      map.off('zoom', updatePosition);
      map.off('move', updatePosition);
    };
  }, [map, center, radiusInKm, isSearching, color, radarElement]);
  
  // Just return null since we're rendering via SVG overlay
  return null;
};

export default RadarCircle;
