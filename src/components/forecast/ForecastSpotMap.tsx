
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import { forecastMarkerService } from '@/services/forecast/markers/forecastMarkerService';
import { Button } from '@/components/ui/button';
import { Loader, MapPin, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ForecastDayAstroData } from '@/services/forecast/types/forecastTypes';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getLocationNameForCoordinates } from '@/components/location/map/LocationNameService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkerStyles from '@/components/photoPoints/map/MarkerStyles.css?inline';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import L from 'leaflet';

// Configure leaflet on client-side only
if (typeof window !== 'undefined') {
  configureLeaflet();
}

interface ForecastSpotMapProps {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  dayIndex?: number;
  minQuality?: number;
  onSpotSelected?: (spot: SharedAstroSpot, forecast?: ForecastDayAstroData) => void;
  className?: string;
  height?: string;
}

// Helper component to handle map events
const MapEventHandler = ({ onMapClick }: { 
  onMapClick?: (lat: number, lng: number) => void 
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!onMapClick) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

const ForecastSpotMap: React.FC<ForecastSpotMapProps> = ({
  latitude,
  longitude,
  radiusKm = 50,
  dayIndex = 0,
  minQuality = 5,
  onSpotSelected,
  className = '',
  height = '400px'
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [spots, setSpots] = useState<SharedAstroSpot[]>([]);
  const [forecastData, setForecastData] = useState<ForecastDayAstroData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([latitude, longitude]);
  
  // Generate forecast markers when component mounts or when key parameters change
  const generateMarkers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await forecastMarkerService.generateForecastMarkers(
        mapCenter[0],
        mapCenter[1],
        radiusKm,
        dayIndex,
        5, // Limit to 5 spots for better performance
        minQuality,
        isMobile
      );
      
      // Setup markers with popups
      const markersList = result.markers.map((marker, index) => {
        const spot = result.locations[index];
        
        marker.bindPopup(() => {
          const popupContent = forecastMarkerService.createForecastPopupContent(spot);
          
          // Create a popup element
          const popupEl = L.DomUtil.create('div');
          popupEl.innerHTML = popupContent;
          
          // Add a button event handler
          const buttonEl = document.createElement('button');
          buttonEl.className = 'bg-primary text-white py-1 px-2 text-xs rounded mt-2 w-full';
          buttonEl.innerText = t('View Details', '查看详情');
          buttonEl.onclick = () => {
            if (onSpotSelected) {
              onSpotSelected(spot);
            }
            marker.closePopup();
          };
          
          popupEl.appendChild(buttonEl);
          
          return popupEl;
        });
        
        return marker;
      });
      
      setMarkers(markersList);
      setSpots(result.locations);
    } catch (error) {
      console.error('Error generating forecast markers:', error);
    } finally {
      setLoading(false);
    }
  }, [mapCenter, radiusKm, dayIndex, minQuality, isMobile, t, onSpotSelected]);
  
  useEffect(() => {
    generateMarkers();
    
    return () => {
      // Clean up markers
      markers.forEach(marker => {
        marker.remove();
      });
    };
  }, [generateMarkers]);
  
  // Handle map click to update center
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    
    try {
      // Get location name for the clicked point
      const locationName = await getLocationNameForCoordinates(lat, lng);
      console.log(`Clicked on: ${locationName} (${lat}, ${lng})`);
    } catch (error) {
      console.error('Error getting location name:', error);
    }
  }, []);
  
  return (
    <Card className={`overflow-hidden shadow-lg ${className}`}>
      <CardHeader className="py-3 px-4 bg-card/80">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            {t('Forecast Spot Map', '预测地点地图')}
          </div>
          {loading && <Loader className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative" style={{ height }}>
          <style>{MarkerStyles}</style>
          <MapContainer
            center={mapCenter}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Current location marker */}
            <Marker position={mapCenter}>
              <Popup>
                {t('Selected Location', '已选位置')}
              </Popup>
            </Marker>
            
            {/* Search radius circle */}
            <Circle
              center={mapCenter}
              radius={radiusKm * 1000}
              pathOptions={{ color: 'rgba(59, 130, 246, 0.5)', weight: 1, dashArray: '5,5' }}
            />
            
            {/* Event handler for map clicks */}
            <MapEventHandler onMapClick={handleMapClick} />
          </MapContainer>
          
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Button 
              variant="default" 
              size="sm" 
              className="shadow-md"
              disabled={loading}
              onClick={generateMarkers}
            >
              <Search className="h-4 w-4 mr-2" />
              {t('Find Spots', '寻找地点')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastSpotMap;
