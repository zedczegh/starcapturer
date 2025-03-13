
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
  
  return (
    <div className="flex flex-col space-y-3">
      <Button 
        variant={locationName ? "default" : "outline"}
        type="button" 
        onClick={handleUseCurrentLocation}
        disabled={loading}
        className={`w-full hover-card transition-colors ${locationName ? 'bg-primary' : 'hover:bg-primary/10'}`}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        {locationName ? (
          <span className="truncate max-w-[90%]">
            {locationName}
          </span>
        ) : (
          t("Use My Location", "使用我的位置")
        )}
      </Button>
      
      <div className="relative mt-2">
        <MapSelector onSelectLocation={onSelectLocation} />
      </div>
    </div>
  );
};

export default LocationSelector;
