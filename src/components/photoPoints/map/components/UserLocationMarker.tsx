
import React, { useState, useEffect } from 'react';
import { Marker, Circle } from 'react-leaflet';
import { divIcon } from 'leaflet';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ 
  position,
  currentSiqs = null
}) => {
  const [animationStep, setAnimationStep] = useState(0);
  
  // Normalize SIQS if needed
  const normalizedSiqs = currentSiqs !== null && currentSiqs > 10 ? currentSiqs / 10 : currentSiqs;
  
  // Pulse animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 3);
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  // Create user location marker icon
  const userIcon = divIcon({
    className: 'user-location-marker',
    html: `<div class="user-marker-pulse pulse-step-${animationStep}">
             <div class="user-marker-center"></div>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
  
  return (
    <>
      <Circle
        center={position}
        pathOptions={{
          color: 'rgb(59, 130, 246)',
          fillColor: 'rgb(59, 130, 246)',
          fillOpacity: 0.2,
          weight: 1
        }}
        radius={100}
      />
      
      <Marker 
        position={position} 
        icon={userIcon}
        zIndexOffset={1000}
      >
        {normalizedSiqs !== null && (
          <div className="siqs-badge">
            <SiqsScoreBadge score={normalizedSiqs} compact={true} />
          </div>
        )}
      </Marker>
    </>
  );
};
