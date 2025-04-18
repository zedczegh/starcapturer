import React, { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker, getFastTileLayer, getTileLayerOptions } from './MapMarkerUtils';
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
    let touchStartPos: { x: number, y: number } | null = null;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isDragging) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    // Enhanced mobile touch handling
    if (isMobile) {
      // Detect touch start position
      map.getContainer().addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches && e.touches[0]) {
          touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      }, { passive: true });
      
      // Track touch movement to detect drags
      map.getContainer().addEventListener('touchmove', (e: TouchEvent) => {
        if (!touchStartPos || !e.touches || !e.touches[0]) return;
        
        const dx = Math.abs(e.touches[0].clientX - touchStartPos.x);
        const dy = Math.abs(e.touches[0].clientY - touchStartPos.y);
        
        // If moved more than threshold, consider it a drag
        if (dx > 10 || dy > 10) {
          isDragging = true;
        }
      }, { passive: true });
      
      // Handle touch end
      map.getContainer().addEventListener('touchend', (e: TouchEvent) => {
        if (isDragging) {
          // Reset for next interaction
          isDragging = false;
          touchStartPos = null;
          return;
        }
        
        // If not dragging, handle as a tap
        if (touchStartPos && map) {
          // Convert touch to map coordinates
          const point = map.containerPointToLatLng(
            L.point(touchStartPos.x, touchStartPos.y)
          );
          
          // Clear any existing timeout
          if (clickTimeout) {
            window.clearTimeout(clickTimeout);
          }
          
          // Add slight delay to ensure it's a tap
          clickTimeout = window.setTimeout(() => {
            onMapClick(point.lat, point.lng);
          }, 50);
        }
        
        // Reset for next interaction
        touchStartPos = null;
      }, { passive: true });
      
      // Also keep standard tap handler as fallback
      map.on('click', handleClick);
    } else {
      // Standard click for desktop
      map.on('click', handleClick);
    }
    
    // Handle drag events
    map.on('dragstart', () => {
      isDragging = true;
      if (clickTimeout !== null) {
        window.clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    });
    
    map.on('dragend', () => {
      // Add small delay before allowing clicks again
      setTimeout(() => {
        isDragging = false;
      }, 100);
    });
    
    return () => {
      map.off('click', handleClick);
      if (isMobile) {
        map.getContainer().removeEventListener('touchstart', () => {});
        map.getContainer().removeEventListener('touchmove', () => {});
        map.getContainer().removeEventListener('touchend', () => {});
      }
      map.off('dragstart');
      map.off('dragend');
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
  
  // Get optimized tile layer
  const { url: tileUrl, attribution } = getFastTileLayer();
  const tileOptions = getTileLayerOptions(isMobile);
  
  // Call the onMapReady callback when the component mounts
  useEffect(() => {
    onMapReady();
  }, [onMapReady]);

  // Handle map click events - ALWAYS enabled on mobile
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // Always allow map clicks, regardless of editable state on mobile
    if (isMobile || editable) {
      onMapClick(lat, lng);
    }
  }, [editable, onMapClick, isMobile]);

  // Get custom marker icon - red for editable, blue for non-editable
  const markerIcon = React.useMemo(() => {
    const markerColor = editable ? '#ea384c' : '#3b82f6';
    return createCustomMarker(markerColor);
  }, [editable]);
  
  // Configure map options for better mobile experience
  const mapOptions: L.MapOptions = {
    center: position,
    zoom: 5,
    attributionControl: false,  // Explicitly disable attribution control
    scrollWheelZoom: true,
    // Mobile-specific options
    tap: isMobile,
    touchZoom: isMobile ? 'center' : true,
    // Reduce map animation to improve performance on mobile
    zoomAnimation: !isMobile,
    fadeAnimation: !isMobile,
    markerZoomAnimation: !isMobile,
    // Increase inertia for smoother drag on mobile
    inertia: true,
    inertiaDeceleration: isMobile ? 2000 : 3000,
    // Smoothness settings
    wheelDebounceTime: isMobile ? 40 : 80,
    zoomSnap: isMobile ? 0.5 : 1,
    // Performance improvements
    worldCopyJump: true,
  };
  
  return (
    <MapContainer
      {...mapOptions}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      whenReady={() => onMapReady()}
      attributionControl={false}  // Additional safety
    >
      <TileLayer
        attribution=""
        url={tileOptions.url}
        maxZoom={tileOptions.maxZoom}
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
      
      {/* Always add MapEvents for map clicks - ESPECIALLY on mobile */}
      <MapEvents onMapClick={handleMapClick} />
    </MapContainer>
  );
};

export default LazyMapComponent;
