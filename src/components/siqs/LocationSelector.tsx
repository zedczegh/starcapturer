
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Search } from "lucide-react";
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

// Define a proper interface for MapSelector props to match with our usage
interface MapSelectorProps {
  onSelectLocation: (location: any) => void;
  onClose: () => void;
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
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-green-400" />
            {/* Add loading text in Chinese if needed */}
            {t === "zh" && <span>加载中</span>}
          </div>
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
      
      <Button
        variant="secondary"
        type="button"
        onClick={handleOpenMap}
        className="w-full transition-all duration-300 border border-cosmic-700/40 hover:border-cosmic-700/70 bg-cosmic-800/40 hover:bg-cosmic-800/60"
      >
        <Search className="h-4 w-4 mr-2" />
        {t("Search for a Location", "搜索位置")}
      </Button>
      
      {isMapOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-cosmic-900 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-cosmic-700">
              <h3 className="text-lg font-medium">{t("Search for a Location", "搜索位置")}</h3>
            </div>
            <div className="h-[60vh]">
              <MapSelector 
                onSelectLocation={handleLocationSelected}
                onClose={() => setIsMapOpen(false)}
              />
            </div>
            <div className="p-4 border-t border-cosmic-700 flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setIsMapOpen(false)}
                className="mr-2"
              >
                {t("Cancel", "取消")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LocationSelector);
