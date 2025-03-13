
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, X } from "lucide-react";
import { getLocationNameFromCoordinates } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  placeDetails?: string;
}

interface MapSelectorProps {
  onSelectLocation: (location: Location) => void;
  children?: React.ReactNode; // Add support for children prop
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectLocation, children }) => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // First try with Nominatim service (international)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5&accept-language=${language}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "AstroSIQS-App",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();
      
      // Format the search results
      const formattedResults = data.map((item: any) => ({
        name: item.display_name.split(",")[0], // First part of display name (locality)
        placeDetails: item.display_name, // Full address for display
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));

      setSearchResults(formattedResults);
      setShowResults(true);
    } catch (error) {
      console.error("Location search error:", error);
      toast.error(t("Search Error", "搜索错误"), {
        description: t(
          "Could not search for this location. Please try again.",
          "无法搜索此位置，请重试。"
        ),
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    onSelectLocation(location);
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 2) {
      searchLocation(e.target.value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Handle click outside to close the results dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // If children are provided, render them with click handler to show search
  if (children) {
    return (
      <div className="relative" ref={containerRef}>
        <div onClick={() => setShowResults(true)}>
          {children}
        </div>
        
        {showResults && (
          <div className="absolute z-50 mt-1 w-64 right-0 rounded-md bg-cosmic-800/80 backdrop-blur-md border border-cosmic-700 shadow-lg overflow-hidden">
            <div className="p-2">
              <Input
                type="text"
                placeholder={t("Search for a location...", "搜索位置...")}
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="w-full pr-10"
                autoFocus
              />
              {isLoading && (
                <div className="absolute right-3 top-5 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <ul className="py-1 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <li
                    key={index}
                    className="cursor-pointer hover:bg-cosmic-700/50 transition-colors px-3 py-2"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary/80" />
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {result.placeDetails}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {searchResults.length === 0 && searchTerm.length > 2 && !isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {t("No locations found", "未找到位置")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default rendering for full search component
  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={t("Search for a location...", "搜索位置...")}
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="w-full pr-10 hover-card transition-colors focus:placeholder-transparent"
        />
        {searchTerm ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-cosmic-800/80 backdrop-blur-md border border-cosmic-700 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((result, index) => (
              <li
                key={index}
                className="cursor-pointer hover:bg-cosmic-700/50 transition-colors px-3 py-2"
                onClick={() => handleSelectLocation(result)}
              >
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary/80" />
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {result.placeDetails}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default MapSelector;
