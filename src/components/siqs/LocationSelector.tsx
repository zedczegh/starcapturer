
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import MapSelector from "../MapSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface LocationSelectorProps {
  locationName: string;
  loading: boolean;
  handleUseCurrentLocation: () => void;
  onSelectLocation: (location: { name: string; latitude: number; longitude: number; placeDetails?: string }) => void;
  noAutoLocationRequest?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locationName,
  loading,
  handleUseCurrentLocation,
  onSelectLocation,
  noAutoLocationRequest = false
}) => {
  const { t } = useLanguage();
  const autoLocationTriggered = useRef(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Auto-trigger location request only once on first mount and if no location exists
  useEffect(() => {
    // Only auto-trigger if:
    // 1. We don't have a location yet
    // 2. We haven't triggered an auto-location request before
    // 3. Auto-location is not disabled
    // 4. Not in a loading state
    if (!locationName && !loading && !autoLocationTriggered.current && !noAutoLocationRequest) {
      console.log("Auto-triggering location request on first mount");
      autoLocationTriggered.current = true;
      
      // Add a small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        handleUseCurrentLocation();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [locationName, loading, handleUseCurrentLocation, noAutoLocationRequest]);
  
  // Check if locationName is just coordinates or a proper name
  const isCoordinateOnly = locationName && locationName.includes("°");
  
  // Format nicer display name for coordinates
  const displayName = isCoordinateOnly ? 
    t("Your current location", "您的当前位置") : 
    locationName;
  
  const handleOpenMap = () => {
    setIsMapOpen(true);
  };
  
  const handleLocationSelected = (location: any) => {
    onSelectLocation(location);
    setIsMapOpen(false);
    
    // Show success toast
    toast.success(
      t("Location selected: ", "已选择位置：") + location.name,
      { duration: 2000 }
    );
  };
  
  return (
    <div className="flex flex-col space-y-3 relative z-10">
      <Button 
        variant={locationName ? "default" : "outline"}
        type="button" 
        onClick={handleUseCurrentLocation}
        disabled={loading}
        className={`w-full transition-all duration-300 ${
          locationName 
            ? 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg hover:translate-y-[-1px]'
            : 'hover:bg-primary/10'
        }`}
        data-location-button="true"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-green-400" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        {locationName ? (
          <span className="truncate max-w-[90%] font-medium">
            {displayName}
          </span>
        ) : (
          t("Use My Location", "使用我的位置")
        )}
      </Button>
      
      {/* Map selector */}
      <MapSelector 
        onSelectLocation={handleLocationSelected}
        isOpen={isMapOpen}
      />
      
      <Button
        variant="secondary"
        type="button"
        onClick={handleOpenMap}
        className="w-full transition-all duration-300 border border-cosmic-700/40 hover:border-cosmic-700/70 bg-cosmic-800/40 hover:bg-cosmic-800/60"
      >
        {t("Select on Map", "在地图上选择")}
      </Button>
    </div>
  );
};

export default React.memo(LocationSelector);
