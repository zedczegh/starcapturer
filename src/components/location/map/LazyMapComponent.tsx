
import React, { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from './MapMarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';

// Fix Leaflet icon issue
// This is necessary because Leaflet's default icon paths are different in a bundled environment
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Map Events component to handle click events with mobile optimization
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!map) return;
    
    let clickTimeout: number | null = null;
    let isDragging = false;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isDragging) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    // Enhanced mobile touch handling
    if (isMobile) {
      map.on('dragstart', () => {
        isDragging = true;
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
        }
      });
      
      map.on('dragend', () => {
        // Short delay to prevent click right after drag
        setTimeout(() => {
          isDragging = false;
        }, 50);
      });
      
      // Better touch handling for mobile
      map.on('tap', (e: any) => {
        if (isDragging) return;
        
        if (clickTimeout !== null) {
          window.clearTimeout(clickTimeout);
        }
        
        // Slight delay to ensure it's a tap not drag
        clickTimeout = window.setTimeout(() => {
          handleClick(e);
        }, 50);
      });
    } else {
      // Standard click for desktop
      map.on('click', handleClick);
    }
    
    return () => {
      map.off('click', handleClick);
      if (isMobile) {
        map.off('tap');
        map.off('dragstart');
        map.off('dragend');
      }
      if (clickTimeout !== null) {
        window.clearTimeout(clickTimeout);
      }
    };
  }, [map, onMapClick, isMobile]);
  
  return null;
};

interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Call the onMapReady callback when the component mounts
  useEffect(() => {
    onMapReady();
  }, [onMapReady]);

  // Handle map click events
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (editable) {
      onMapClick(lat, lng);
    }
  }, [editable, onMapClick]);

  // Get custom marker icon - red for editable, blue for non-editable
  const markerIcon = React.useMemo(() => {
    const markerColor = editable ? '#ea384c' : '#3b82f6';
    return createCustomMarker(markerColor);
  }, [editable]);
  
  // Configure map options for better mobile experience
  const mapOptions: L.MapOptions = {
    center: position,
    zoom: 5,
    attributionControl: true,
    scrollWheelZoom: true,
    // Mobile-specific options
    tap: isMobile,
    touchZoom: isMobile ? 'center' : true,
    bounceAtZoomLimits: !isMobile, // Disable bounce on mobile
    // Reduce map animation to improve performance on mobile
    zoomAnimation: !isMobile,
    fadeAnimation: !isMobile,
    markerZoomAnimation: !isMobile,
    // Increase inertia for smoother drag on mobile
    inertia: true,
    inertiaDeceleration: isMobile ? 2000 : 3000,
    // Smoothness settings
    wheelDebounceTime: isMobile ? 40 : 80,
    zoomSnap: isMobile ? 0.5 : 1
  };
  
  return (
    <MapContainer
      {...mapOptions}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      whenReady={() => onMapReady()}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={markerIcon}>
        <Popup>
          <div className="p-1">
            <strong>{locationName || t("Selected Location", "所选位置")}</strong>
            <div className="text-xs mt-1">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </div>
            {isDarkSkyReserve && (
              <div className="mt-1 text-xs font-semibold text-blue-600">
                {t("Dark Sky Reserve", "暗夜保护区")}
              </div>
            )}
            {certification && (
              <div className="mt-1 text-xs font-semibold text-green-600">
                {certification}
              </div>
            )}
          </div>
        </Popup>
      </Marker>
      
      {/* Add MapEvents component to handle clicks with mobile optimization */}
      {editable && <MapEvents onMapClick={handleMapClick} />}
    </MapContainer>
  );
};

export default LazyMapComponent;
