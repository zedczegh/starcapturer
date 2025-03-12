
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with React
// This is needed because the default marker icons are not properly loaded in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude, name }) => {
  // Handle potential invalid coordinates with safer defaults
  const validLatitude = latitude !== undefined && isFinite(latitude) ? latitude : 0;
  const validLongitude = longitude !== undefined && isFinite(longitude) ? longitude : 0;
  const validName = name || "Unknown Location";

  // Create a position array that matches Leaflet's expected [lat, lng] format
  const position: L.LatLngExpression = [validLatitude, validLongitude];

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full h-[300px]">
          <MapContainer 
            center={position}
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                {validName}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-1">Location</h3>
          <p className="text-sm text-muted-foreground">
            {validName} is located at coordinates {validLatitude.toFixed(6)}, {validLongitude.toFixed(6)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This area may have specific conditions that affect astrophotography quality.
            Check local regulations before setting up equipment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationMap;
