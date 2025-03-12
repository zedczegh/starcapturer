
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude, name }) => {
  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&q=${latitude},${longitude}&zoom=12`}
            allowFullScreen
            title={`Map of ${name}`}
          ></iframe>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-1">Location</h3>
          <p className="text-sm text-muted-foreground">
            {name} is located at coordinates {latitude.toFixed(6)}, {longitude.toFixed(6)}
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
