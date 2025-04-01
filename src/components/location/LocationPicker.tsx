import React, { useState, useEffect, useRef } from "react";
import { SearchIcon, MapPin, Locate } from "lucide-react";
import { searchLocations } from "@/services/geocoding";
import { useLanguage } from "@/contexts/LanguageContext";
import { Location as LocationType } from "@/services/geocoding/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExtendedGeolocationOptions, getCurrentPosition } from "@/utils/geolocationUtils";

interface LocationPickerProps {
  locationName: string;
  loading: boolean;
  onSelectLocation: (location: LocationType) => void;
  handleUseCurrentLocation: () => void;
  noAutoLocationRequest?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  locationName,
  loading,
  onSelectLocation,
  handleUseCurrentLocation,
  noAutoLocationRequest = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  
  useEffect(() => {
    if (locationName) {
      setSearchQuery(locationName);
    }
  }, [locationName]);
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== "") {
      const results = await searchLocations(query, language);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };
  
  const handleSelect = (location: LocationType) => {
    onSelectLocation(location);
    setOpen(false);
    setSearchQuery(location.name);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };
  
  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    setError(null);
    
    const geolocationOptions: ExtendedGeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      language: language
    };

    getCurrentPosition(
      (position) => {
        setIsLoading(false);
        handleUseCurrentLocation();
      },
      (error) => {
        setIsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setError(t("Location permission denied. Please enable it in your browser settings.", "位置权限被拒绝。请在浏览器设置中启用它。"));
        } else {
          setError(t("Failed to get current location.", "获取当前位置失败。"));
        }
        console.error("Error getting current location:", error);
      },
      geolocationOptions
    );
  };
  
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 opacity-70" />
              {searchQuery ? (
                searchQuery
              ) : (
                <span className="text-muted-foreground">
                  {t("Search for a location...", "搜索地点...")}
                </span>
              )}
            </span>
            <SearchIcon className="h-4 w-4 opacity-70 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("Type a location...", "输入地点...")}
              onChange={(e) => handleSearch(e.target.value)}
              ref={searchInputRef}
            />
            <CommandEmpty>{t("No results found.", "没有找到结果。")}</CommandEmpty>
            <ScrollArea className="h-[200px]">
              <CommandGroup heading={t("Suggestions", "建议")}>
                {searchResults.map((location) => (
                  <CommandItem
                    key={location.name}
                    onSelect={() => handleSelect(location)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{location.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
            <div className="py-2 px-3 border-t border-muted">
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={handleGetCurrentLocation}
                disabled={isLoading || noAutoLocationRequest}
              >
                {isLoading ? (
                  <>
                    <Locate className="mr-2 h-4 w-4 animate-spin" />
                    {t("Locating...", "定位中...")}
                  </>
                ) : (
                  <>
                    <Locate className="mr-2 h-4 w-4" />
                    {t("Use Current Location", "使用当前位置")}
                  </>
                )}
              </Button>
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationPicker;
