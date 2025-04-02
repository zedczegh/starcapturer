
import React, { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { searchLocations } from "@/services/geocoding";
import { useLanguage } from "@/contexts/LanguageContext";
import { Location as LocationType } from "@/services/geocoding/types";
import { saveLocation } from "@/utils/locationStorage";
import { SIQSLocation } from "@/utils/locationStorage";

interface MapSelectorProps {
  onLocationSelect?: (location: SIQSLocation) => void;
  onSelectLocation?: (location: SIQSLocation) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onLocationSelect, onSelectLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  
  // Handle all location selections through this unified function
  const handleLocationSelection = (location: SIQSLocation) => {
    saveLocation(location);
    
    // Call the appropriate callback based on which prop was provided
    if (onLocationSelect) {
      onLocationSelect(location);
    } else if (onSelectLocation) {
      onSelectLocation(location);
    }
    
    setSearchResults([]);
    setSearchQuery("");
    
    // Clear the input field
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }
  
  // Improved debounce search function with better handling
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (query: string) => {
      clearTimeout(timeoutId);
      
      if (query.trim() === "") {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      
      timeoutId = setTimeout(async () => {
        try {
          const results = await searchLocations(query, language);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    };
  }, [language]);
  
  // Handle search input changes
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };
  
  // Handle location selection from search results
  const handleSearchResultSelect = (location: LocationType) => {
    const siqsLocation: SIQSLocation = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    };
    
    handleLocationSelection(siqsLocation);
  };
  
  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          ref={searchInputRef}
          placeholder={t("Search for a location...", "搜索地点...")}
          className="w-full px-4 py-2 rounded-md bg-cosmic-800 border border-cosmic-700 text-white focus:outline-none focus:border-primary transition-colors duration-200"
          onChange={handleSearchInputChange}
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          {isSearching ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-opacity-50 border-t-primary rounded-full"></div>
          ) : (
            <SearchIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full rounded-md shadow-lg bg-cosmic-800 border border-cosmic-700 divide-y divide-cosmic-700 max-h-60 overflow-auto">
          {searchResults.map((result, index) => (
            <li
              key={index}
              className="px-4 py-2 text-white hover:bg-cosmic-700 cursor-pointer transition-colors duration-200"
              onClick={() => handleSearchResultSelect(result)}
            >
              {result.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MapSelector;
