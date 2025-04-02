
import React, { useState, useCallback } from "react";
import { LazyMapComponent } from "../lazy";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapIcon } from "lucide-react";

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  locationName: string;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  latitude,
  longitude,
  locationName,
  isDarkSkyReserve = false,
  certification = ""
}) => {
  const { t } = useLanguage();
  const [mapReady, setMapReady] = useState(false);
  
  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);
  
  // Handle map click event (not used in this component, but required for props)
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // This is just a placeholder - not used in this read-only map
    console.log("Map clicked at:", lat, lng);
  }, []);
  
  return (
    <Card className="bg-cosmic-800/50 border-cosmic-700 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <MapIcon className="w-5 h-5 mr-2 text-primary" />
          {t("Location", "位置")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 h-[320px]">
        <LazyMapComponent 
          latitude={latitude}
          longitude={longitude}
          locationName={locationName}
          editable={false}
          onMapReady={handleMapReady}
          onMapClick={handleMapClick}
          showInfoPanel={true}
          isDarkSkyReserve={isDarkSkyReserve}
          certification={certification}
        />
      </CardContent>
    </Card>
  );
};

export default MapDisplay;
