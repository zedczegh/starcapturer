
import React, { useEffect, useRef } from 'react';
import { useMapProvider } from '@/contexts/MapProviderContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/components/photoPoints/map/AMapStyles.css';
import L from 'leaflet';
import { createCustomMarker } from './map/MapMarkerUtils';
import MapTooltip from './map/MapTooltip';
import MapClickHandler from '../location/map/MapClickHandler';

interface MapDisplayProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number;
}

// Leaflet Map Component
const LeafletMapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  isDarkSkyReserve = false,
  certification = '',
  siqs
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Custom marker icon
  const markerColor = isDarkSkyReserve || certification ? '#8b5cf6' : '#e11d48';
  const markerIcon = createCustomMarker(markerColor);
  
  // MapReady component to handle initialization
  const MapReady = () => {
    const map = useMap();
    
    useEffect(() => {
      // Store map reference
      mapRef.current = map;
      
      // Remove attribution control if it exists
      if (map.attributionControl) {
        map.removeControl(map.attributionControl);
      }
      
      // Call onMapReady callback
      if (onMapReady) {
        onMapReady();
      }
    }, [map]);
    
    return null;
  };
  
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
      attributionControl={false}
    >
      <TileLayer
        attribution=""
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={position} icon={markerIcon}>
        <MapTooltip 
          name={locationName} 
          latitude={position[0]} 
          longitude={position[1]}
          isDarkSkyReserve={isDarkSkyReserve}
          certification={certification}
          siqs={siqs}
        />
      </Marker>
      
      {/* Map initialization event */}
      <MapReady />
      
      {/* Map click handler */}
      {editable && onMapClick && (
        <MapClickHandler onClick={onMapClick} />
      )}
    </MapContainer>
  );
};

// AMap Component
const AMapDisplay: React.FC<MapDisplayProps> = ({
  position,
  editable = false,
  onMapReady,
  onMapClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new (window as any).AMap.Map(mapContainer.current, {
      center: [position[1], position[0]], // AMap uses [lng, lat]
      zoom: 13,
      mapStyle: 'amap://styles/whitesmoke',
      showLabel: true,
      showIndoorMap: false,
    });

    mapInstance.current = map;

    // Red marker for location
    const marker = new (window as any).AMap.Marker({
      position: [position[1], position[0]],
      icon: new (window as any).AMap.Icon({
        size: new (window as any).AMap.Size(32, 42),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26c0-8.8-7.2-16-16-16z" fill="#e11d48"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        imageSize: new (window as any).AMap.Size(32, 42),
      }),
      title: 'Location',
      anchor: 'bottom-center',
      zIndex: 200,
    });

    map.add(marker);
    markerRef.current = marker;

    if (editable && onMapClick) {
      map.on('click', (e: any) => {
        onMapClick(e.lnglat.lat, e.lnglat.lng);
      });
    }

    if (onMapReady) {
      map.on('complete', onMapReady);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition([position[1], position[0]]);
    }
    if (mapInstance.current) {
      mapInstance.current.setCenter([position[1], position[0]]);
    }
  }, [position]);

  return (
    <div 
      ref={mapContainer} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    />
  );
};

const MapDisplay: React.FC<MapDisplayProps> = (props) => {
  const { provider, isAMapReady } = useMapProvider();

  if (provider === 'amap' && isAMapReady) {
    return <AMapDisplay {...props} />;
  }

  return <LeafletMapDisplay {...props} />;
};

export default MapDisplay;
