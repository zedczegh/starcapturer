
import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import MapSelector from "../MapSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationSelectorProps {
  locationName: string;
  loading: boolean;
  handleUseCurrentLocation: () => void;
  onSelectLocation: (location: { name: string; latitude: number; longitude: number; placeDetails?: string }) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locationName,
  loading,
  handleUseCurrentLocation,
  onSelectLocation
}) => {
  const { t } = useLanguage();
  
  // Check if locationName is just coordinates or a proper name
  const isCoordinateOnly = locationName && locationName.includes("°");
  
  // Format nicer display name for coordinates
  const displayName = isCoordinateOnly ? 
    t("Your current location", "您的当前位置") : 
    locationName;
  
  return (
    <div className="flex flex-col space-y-3 relative z-10">
      <Button 
        variant={locationName ? "default" : "outline"}
        type="button" 
        onClick={handleUseCurrentLocation}
        disabled={loading}
        className={`w-full hover-card transition-colors ${locationName ? 'bg-primary' : 'hover:bg-primary/10'}`}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-green-400" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        {locationName ? (
          <span className="truncate max-w-[90%]">
            {displayName}
          </span>
        ) : (
          t("Use My Location", "使用我的位置")
        )}
      </Button>
      
      <div className="relative mt-2 z-20">
        <MapSelector onSelectLocation={onSelectLocation} />
      </div>
    </div>
  );
};

export default LocationSelector;
