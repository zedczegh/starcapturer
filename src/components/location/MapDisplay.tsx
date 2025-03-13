
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create a custom marker with animation effects
const createCustomMarker = (): L.DivIcon => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="marker-pin-container">
        <div class="marker-pin animate-bounce"></div>
        <div class="marker-shadow"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

// Component to update the map view when position changes
const MapUpdater = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
        map.panTo(position, { animate: true, duration: 0.5 });
      } catch (error) {
        console.error("Error updating map view:", error);
      }
    }
  }, [position, map]);
  
  return null;
};

// Interactive map component that handles clicks
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  // Set up click handler
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

interface MapDisplayProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick
}) => {
  const { t } = useLanguage();
  const [mapInitialized, setMapInitialized] = useState(false);

  // Effect to add custom CSS for marker animation
  useEffect(() => {
    if (!document.getElementById('custom-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-marker-styles';
      style.innerHTML = `
        .custom-marker-icon {
          background: transparent;
          border: none;
        }
        .marker-pin-container {
          position: relative;
          width: 30px;
          height: 42px;
        }
        .marker-pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: #9b87f5;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -12px;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }
        .marker-pin::after {
          content: '';
          width: 14px;
          height: 14px;
          margin: 5px 0 0 5px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }
        .marker-shadow {
          width: 24px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0,0,0,0.15);
          position: absolute;
          left: 50%;
          top: 100%;
          margin: -6px 0 0 -12px;
          transform: rotateX(55deg);
          z-index: -1;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(155, 135, 245, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(155, 135, 245, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(155, 135, 245, 0);
          }
        }
        .animate-bounce {
          animation: pulse 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleMapReady = (event: { target: L.Map }) => {
    setMapInitialized(true);
    onMapReady();
  };

  // Use a China-friendly tile server
  const tileServerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <MapContainer 
      center={position}
      zoom={12} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      whenReady={handleMapReady}
      attributionControl={false}
      className="z-0"
    >
      <TileLayer
        url={tileServerUrl}
        attribution={attribution}
        subdomains={['a', 'b', 'c']}
      />
      
      <Marker 
        position={position}
        icon={createCustomMarker()}
      >
        <Popup>
          {locationName}
        </Popup>
      </Marker>
      
      <MapUpdater position={position} />
      {editable && <MapEvents onMapClick={onMapClick} />}
    </MapContainer>
  );
};

export default React.memo(MapDisplay);
