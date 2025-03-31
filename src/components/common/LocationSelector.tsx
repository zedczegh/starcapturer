
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { SearchIcon, MapIcon, Locate } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchLocations } from '@/services/geocoding';
import { SIQSLocation } from '@/utils/locationStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { toast } from 'sonner';

interface LocationSelectorProps {
  onLocationSelect: (location: SIQSLocation) => void;
  buttonLabel?: string;
  placeholder?: string;
  includeCurrentLocation?: boolean;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  buttonLabel,
  placeholder,
  includeCurrentLocation = true,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use geolocation hook
  const { 
    getPosition, 
    coords, 
    loading: geoLoading, 
    error: geoError 
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    language
  });
  
  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to search after typing stops
    if (query.trim().length > 1) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchLocations(query, language);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching locations:', error);
          toast.error(
            language === 'en' 
              ? 'Failed to search locations' 
              : '搜索地点失败'
          );
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };
  
  // Handle selecting a search result
  const handleSelectLocation = (location: any) => {
    onLocationSelect({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    });
    
    // Clear search results and input
    setSearchResults([]);
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  // Handle using current location
  const handleUseCurrentLocation = useCallback(async () => {
    try {
      await getPosition();
      
      if (coords) {
        // We need to get a location name for the coordinates
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYXN0cm9wbGFubmVyIiwiYSI6ImNsc2I0d2txbTBkMWoybHFuZmJ6cDNzcWQifQ.MGCCvI4zlgaMtK88q-iu7A'}`
          );
          
          const data = await response.json();
          const locationName = data.features[0]?.place_name || 
            `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
            
          onLocationSelect({
            name: locationName,
            latitude: coords.latitude,
            longitude: coords.longitude
          });
          
        } catch (error) {
          // If reverse geocoding fails, use coordinates as the name
          onLocationSelect({
            name: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
            latitude: coords.latitude,
            longitude: coords.longitude
          });
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to get your current location' 
          : '获取当前位置失败'
      );
    }
  }, [coords, getPosition, language, onLocationSelect]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || t("Search for a location...", "搜索地点...")}
          onChange={handleSearchInputChange}
          className="w-full bg-cosmic-800/80 border-cosmic-700"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          {isSearching ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-cosmic-800 border border-cosmic-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((result, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-cosmic-700 cursor-pointer text-sm flex items-center justify-between"
                onClick={() => handleSelectLocation(result)}
              >
                <div className="truncate pr-2">{result.name}</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {result.latitude.toFixed(2)}, {result.longitude.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex space-x-3">
        {includeCurrentLocation && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="flex-1"
          >
            {geoLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Locate className="h-4 w-4 mr-2" />
            )}
            {t("Current Location", "当前位置")}
          </Button>
        )}
        
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={() => {
            // Open map selector
            const mapSelectEvent = new CustomEvent('openMapSelect', {
              detail: { onSelect: onLocationSelect }
            });
            document.dispatchEvent(mapSelectEvent);
          }}
        >
          <MapIcon className="h-4 w-4 mr-2" />
          {buttonLabel || t("Select on Map", "在地图上选择")}
        </Button>
      </div>
    </div>
  );
};

export default LocationSelector;
