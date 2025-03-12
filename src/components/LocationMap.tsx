
import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { toast } from "@/components/ui/use-toast";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getLocationNameFromCoordinates } from "@/lib/api";

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

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  onLocationUpdate?: (location: { name: string; latitude: number; longitude: number }) => void;
  editable?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  latitude, 
  longitude, 
  name,
  onLocationUpdate,
  editable = false 
}) => {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const mapRef = useRef<L.Map>(null);

  // Handle potential invalid coordinates with safer defaults
  const validLatitude = latitude !== undefined && isFinite(latitude) ? latitude : 0;
  const validLongitude = longitude !== undefined && isFinite(longitude) ? longitude : 0;
  const validName = name || "Unknown Location";

  // Interactive map component that handles clicks
  const MapEvents = () => {
    useMapEvents({
      click: async (e: L.LeafletMouseEvent) => {
        if (!editable) return;
        
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        
        try {
          const newName = await getLocationNameFromCoordinates(lat, lng, 'en');
          
          if (onLocationUpdate) {
            onLocationUpdate({
              name: newName,
              latitude: lat,
              longitude: lng
            });
          }
          
          toast({
            title: "Location Updated",
            description: `New location: ${newName}`,
          });
        } catch (error) {
          console.error('Error getting location name:', error);
          const fallbackName = `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
          
          if (onLocationUpdate) {
            onLocationUpdate({
              name: fallbackName,
              latitude: lat,
              longitude: lng
            });
          }
          
          toast({
            title: "Location Error",
            description: "Could not get location name. Using coordinates instead.",
            variant: "destructive",
          });
        }
      },
    });
    
    return null;
  };

  // Effect to add custom CSS for marker animation if not already present
  React.useEffect(() => {
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

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full h-[300px]">
          <MapContainer 
            center={position}
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker 
              position={position}
              icon={createCustomMarker()}
            />
            {editable && <MapEvents />}
          </MapContainer>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-1">Location</h3>
          <p className="text-sm text-muted-foreground">
            {validName} is located at coordinates {validLatitude.toFixed(6)}, {validLongitude.toFixed(6)}
          </p>
          {editable && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#9b87f5] animate-pulse"></span>
              Click anywhere on the map to update the location
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationMap;
