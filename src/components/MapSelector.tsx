import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, Map as MapIcon, Loader2 } from 'lucide-react';

interface MapSelectorProps {
  onSelectLocation: (location: { name: string; latitude: number; longitude: number }) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=5&apiKey=15e5b6c349394203aef5d9df134a47d1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const timeoutId = setTimeout(() => {
      searchLocations(query);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };
  
  const handleSuggestionClick = (suggestion: any) => {
    const properties = suggestion.properties;
    const location = {
      name: properties.formatted,
      latitude: suggestion.geometry.coordinates[1],
      longitude: suggestion.geometry.coordinates[0]
    };
    
    setSelectedLocation(location);
    setSearchQuery(properties.formatted);
    setSuggestions([]);
    
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([location.longitude, location.latitude]);
    }
  };
  
  const handleSelectLocation = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      setIsOpen(false);
    }
  };
  
  const initializeMap = () => {
    if (!mapContainerRef.current || !isOpen) return;
    
    const dummyMapElement = document.createElement('div');
    dummyMapElement.style.width = '100%';
    dummyMapElement.style.height = '100%';
    dummyMapElement.style.backgroundColor = '#f0f0f0';
    dummyMapElement.style.display = 'flex';
    dummyMapElement.style.alignItems = 'center';
    dummyMapElement.style.justifyContent = 'center';
    dummyMapElement.textContent = 'Map Placeholder';
    
    mapContainerRef.current.innerHTML = '';
    mapContainerRef.current.appendChild(dummyMapElement);
  };
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(initializeMap, 100);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild id="mapSelectorTrigger">
        <Button variant="ghost" className="w-full sr-only">
          <MapIcon className="h-4 w-4" />
          <span>Search on Map</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for a location..."
            className="pr-8"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
          
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <p className="text-sm">{suggestion.properties.formatted}</p>
                </div>
              ))}
            </div>
          )}
          
          {loading && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div ref={mapContainerRef} className="flex-1 rounded-md border border-input bg-background min-h-[300px] mb-4">
          {/* Map will be initialized here */}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSelectLocation} disabled={!selectedLocation}>Select Location</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapSelector;
