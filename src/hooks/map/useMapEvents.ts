
import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseMapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
  editable?: boolean;
}

export const useMapEvents = ({ onMapClick, editable }: UseMapEventsProps) => {
  const map = useMap();
  const isMobile = useIsMobile();
  const clickTimeout = useRef<number | null>(null);
  const isDragging = useRef(false);
  const touchStartPos = useRef<{x: number, y: number} | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isDragging.current) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    // Enhanced mobile touch handling
    if (isMobile) {
      map.getContainer().addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches && e.touches[0]) {
          touchStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      }, { passive: true });
      
      map.getContainer().addEventListener('touchmove', (e: TouchEvent) => {
        if (!touchStartPos.current || !e.touches || !e.touches[0]) return;
        
        const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
        
        if (dx > 10 || dy > 10) {
          isDragging.current = true;
        }
      }, { passive: true });
      
      map.getContainer().addEventListener('touchend', () => {
        if (isDragging.current) {
          isDragging.current = false;
          touchStartPos.current = null;
          return;
        }
        
        if (touchStartPos.current && map) {
          const point = map.containerPointToLatLng(
            L.point(touchStartPos.current.x, touchStartPos.current.y)
          );
          
          if (clickTimeout.current) {
            window.clearTimeout(clickTimeout.current);
          }
          
          clickTimeout.current = window.setTimeout(() => {
            onMapClick(point.lat, point.lng);
          }, 50);
        }
        
        touchStartPos.current = null;
      });
    } else {
      if (editable) {
        map.on('click', handleClick);
      }
    }
    
    return () => {
      if (!isMobile && editable) {
        map.off('click', handleClick);
      }
      if (isMobile) {
        map.getContainer().removeEventListener('touchstart', () => {});
        map.getContainer().removeEventListener('touchmove', () => {});
        map.getContainer().removeEventListener('touchend', () => {});
      }
      if (clickTimeout.current !== null) {
        window.clearTimeout(clickTimeout.current);
      }
    };
  }, [map, onMapClick, editable, isMobile]);
};
