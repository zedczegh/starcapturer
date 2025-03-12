
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude, name }) => {
  // Handle potential invalid coordinates
  const validLatitude = isFinite(latitude) ? latitude : 0;
  const validLongitude = isFinite(longitude) ? longitude : 0;
  const validName = name || "Unknown Location";

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&q=${validLatitude},${validLongitude}&zoom=12`}
            allowFullScreen
            title={`Map of ${validName}`}
          ></iframe>
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
