
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { searchLocations } from "@/services/geocoding";
import { useLanguage } from "@/contexts/LanguageContext";
import { Location as LocationType } from "@/services/geocoding/types";
import { saveLocation } from "@/utils/locationStorage";
import { SIQSLocation } from "@/utils/locationStorage";

interface MapSelectorProps {
  onLocationSelect?: (location: SIQSLocation) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationType[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  
  // Handle location selection
  const handleLocationSelection = (location: SIQSLocation) => {
    saveLocation(location);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    
    setSearchResults([]);
    setSearchQuery("");
    
    // Clear the input field
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };
  
  // Debounce search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (query: string) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        if (query.trim() !== "") {
          const results = await searchLocations(query, language);
          setSearchResults(results);
        } else {
          setSearchResults([]);
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
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full rounded-md shadow-lg bg-cosmic-800 border border-cosmic-700 divide-y divide-cosmic-700">
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
