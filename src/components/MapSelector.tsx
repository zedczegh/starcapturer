
import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon, Loader2 } from "lucide-react";
import { searchLocations } from "@/services/geocoding";
import { useLanguage } from "@/contexts/LanguageContext";
import { Location as LocationType } from "@/services/geocoding/types";
import { saveLocation } from "@/utils/locationStorage";
import { SIQSLocation } from "@/utils/locationStorage";
import { parseCoordinateInput } from "@/utils/validation/coordinateValidator";

interface MapSelectorProps {
  onLocationSelect?: (location: SIQSLocation) => void;
  onSelectLocation?: (location: SIQSLocation) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onLocationSelect, onSelectLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<LocationType[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recent_location_searches');
      if (savedSearches) {
        const parsedSearches = JSON.parse(savedSearches);
        if (Array.isArray(parsedSearches)) {
          setRecentSearches(parsedSearches.slice(0, 5)); // Show max 5 recent searches
        }
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);
  
  // Save a search to recent searches
  const saveToRecentSearches = (location: LocationType) => {
    try {
      // Add the new location to the start of the array and remove dupes
      const updatedSearches = [
        location,
        ...recentSearches.filter(item => 
          item.latitude !== location.latitude || 
          item.longitude !== location.longitude
        )
      ].slice(0, 5); // Keep only 5 most recent
      
      setRecentSearches(updatedSearches);
      localStorage.setItem('recent_location_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };
  
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
  };
  
  // Enhanced debounce search function with better handling
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (query: string) => {
      clearTimeout(timeoutId);
      
      if (query.trim() === "") {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      // Check if the input looks like coordinates
      const coordinates = parseCoordinateInput(query);
      if (coordinates) {
        // No need to search API, we have valid coordinates
        const coordLocation: LocationType = {
          name: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          placeDetails: t("Entered coordinates", "输入的坐标")
        };
        
        setSearchResults([coordLocation]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      
      timeoutId = setTimeout(async () => {
        try {
          // Enhanced search with better parameters
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
  }, [language, t]);
  
  // Handle search input changes
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };
  
  // Handle form submission for direct coordinate entry
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Check if current query is valid coordinates
    const coordinates = parseCoordinateInput(searchQuery);
    if (coordinates) {
      const coordLocation: SIQSLocation = {
        name: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      // Save to recent searches
      saveToRecentSearches(coordLocation);
      
      // Use the location
      handleLocationSelection(coordLocation);
    } else if (searchResults.length > 0) {
      // If not coordinates but we have search results, use the first one
      handleSearchResultSelect(searchResults[0]);
    }
  };
  
  // Handle location selection from search results
  const handleSearchResultSelect = (location: LocationType) => {
    const siqsLocation: SIQSLocation = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    };
    
    // Save to recent searches
    saveToRecentSearches(location);
    
    handleLocationSelection(siqsLocation);
  };
  
  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleFormSubmit} className="relative">
        <input
          type="text"
          ref={searchInputRef}
          placeholder={t("Search for a location or enter coordinates...", "搜索地点或输入坐标...")}
          className="w-full px-4 py-2 rounded-md bg-cosmic-800 border border-cosmic-700 text-white focus:outline-none focus:border-primary transition-colors duration-200"
          onChange={handleSearchInputChange}
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <SearchIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </form>
      
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
              {result.placeDetails && (
                <p className="text-xs text-muted-foreground">{result.placeDetails}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {/* Recent Searches - Show when no current search in progress */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-md shadow-lg bg-cosmic-800 border border-cosmic-700 divide-y divide-cosmic-700 max-h-60 overflow-auto">
          <div className="px-4 py-2 text-sm text-muted-foreground">
            {t("Recent Searches", "最近搜索")}
          </div>
          {recentSearches.map((result, index) => (
            <li
              key={`recent-${index}`}
              className="px-4 py-2 text-white hover:bg-cosmic-700 cursor-pointer transition-colors duration-200 list-none"
              onClick={() => handleSearchResultSelect(result)}
            >
              {result.name}
            </li>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapSelector;
