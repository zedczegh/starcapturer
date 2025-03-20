
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPinIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MapSelector from "@/components/MapSelector";

// Define interface for geocoding results
interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  placeId?: string | null;
  country?: string | null;
  formattedAddress?: string | null;
}

interface LocationSelectorProps {
  onSelectLocation: (location: GeocodingResult) => void;
  buttonClass?: string;
  loading?: boolean;
  handleUseCurrentLocation?: () => void;
  noAutoLocationRequest?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  onSelectLocation,
  buttonClass = "w-full",
  loading = false,
  handleUseCurrentLocation,
  noAutoLocationRequest = false
}) => {
  const { t, language } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);
  
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSearchQuery("");
  }, []);
  
  // Focus the search input when the dialog opens
  useEffect(() => {
    if (isDialogOpen && searchInputRef.current) {
      // Use a timeout to allow the dialog animation to complete
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isDialogOpen]);
  
  // Handle location selection from the map
  const handleMapSelection = useCallback((selectedLocation: any) => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      onSelectLocation({
        name: selectedLocation.name || selectedLocation.displayName || "Selected Location",
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        placeId: selectedLocation.placeId || null,
        country: selectedLocation.country || null,
        formattedAddress: selectedLocation.displayName || null
      });
      handleCloseDialog();
    }
  }, [onSelectLocation, handleCloseDialog]);
  
  return (
    <>
      <Button 
        className={`${buttonClass} flex items-center justify-center gap-2 transition-all hover:scale-[1.01] bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:shadow-lg active:scale-[0.99]`} 
        onClick={handleOpenDialog}
        disabled={loading}
      >
        <Search size={16} />
        <span>
          {t("Search for a Location", "搜索位置")}
        </span>
        {loading && (
          <span className="ml-2 flex items-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-dotted border-white" />
            {language === 'zh' && <span className="ml-1 text-xs">加载中</span>}
          </span>
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("Search or Select Location", "搜索或选择位置")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mb-4 relative">
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search by location name...", "按位置名称搜索...")}
              className="pr-10 shadow-sm"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
          
          <div className="flex-1 min-h-[500px] overflow-hidden">
            <MapSelector 
              onSelectLocation={handleMapSelection}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LocationSelector;
