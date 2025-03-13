
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationMap from "@/components/location/LocationMap";
import LocationControls from "@/components/location/LocationControls";

interface LocationUpdaterProps {
  locationData: any;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  gettingUserLocation: boolean;
  setGettingUserLocation: (state: boolean) => void;
  setStatusMessage: (message: string | null) => void;
}

const LocationUpdater: React.FC<LocationUpdaterProps> = ({
  locationData,
  onLocationUpdate,
  gettingUserLocation,
  setGettingUserLocation,
  setStatusMessage
}) => {
  const { t } = useLanguage();

  // Safely check if locationData has required properties
  const hasValidCoordinates = locationData && 
    typeof locationData.latitude === 'number' && isFinite(locationData.latitude) && 
    typeof locationData.longitude === 'number' && isFinite(locationData.longitude);

  // Default coordinates to use if locationData is invalid
  const fallbackLatitude = 0;
  const fallbackLongitude = 0;
  const fallbackName = t("Unnamed Location", "未命名位置");

  return (
    <Card className="shadow-xl overflow-hidden bg-cosmic-900/80 border-cosmic-600/20 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2 bg-cosmic-800/50 border-b border-cosmic-600/10">
        <CardTitle className="text-xl flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-primary" />
          {t("Location", "位置")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <LocationMap
          latitude={hasValidCoordinates ? locationData.latitude : fallbackLatitude}
          longitude={hasValidCoordinates ? locationData.longitude : fallbackLongitude}
          name={hasValidCoordinates && locationData.name ? locationData.name : fallbackName}
          onLocationUpdate={onLocationUpdate}
          editable={true}
        />
        <LocationControls
          onLocationUpdate={onLocationUpdate}
          gettingUserLocation={gettingUserLocation}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
        />
      </CardContent>
    </Card>
  );
};

export default LocationUpdater;
