
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, Map as MapIcon, Loader2, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to move the map center when coordinates change
const ChangeMapCenter = ({ coordinates }: { coordinates: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(coordinates, map.getZoom());
  }, [coordinates, map]);
  
  return null;
};

interface MapSelectorProps {
  onSelectLocation: (location: { name: string; latitude: number; longitude: number }) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<[number, number]>([20, 0]); // Default position
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      // Using a free and open geocoding API (Nominatim - OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'AstroSIQS-App'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      toast({
        title: "Search Error",
        description: "Could not find location suggestions. Please try again.",
        variant: "destructive",
      });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        searchLocations(query);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (suggestion: any) => {
    const location = {
      name: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    };
    
    setSelectedLocation(location);
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    setPosition([location.latitude, location.longitude]);
  };
  
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    
    // When a location is clicked on the map, fetch the location name
    fetchLocationName(lat, lng);
  };
  
  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const name = await getLocationNameFromCoordinates(lat, lng);
      setSelectedLocation({
        name,
        latitude: lat,
        longitude: lng
      });
      setSearchQuery(name);
    } catch (error) {
      console.error('Error fetching location name:', error);
      setSelectedLocation({
        name: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng
      });
      setSearchQuery(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };
  
  const getLocationNameFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'AstroSIQS-App'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location name');
      }
      
      const data = await response.json();
      return data.display_name || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting location name:', error);
      return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };
  
  const handleSelectLocation = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      setIsOpen(false);
    }
  };
  
  // Use user's current location to initialize the map
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setPosition([lat, lng]);
          
          try {
            const name = await getLocationNameFromCoordinates(lat, lng);
            setSelectedLocation({
              name,
              latitude: lat,
              longitude: lng
            });
            setSearchQuery(name);
          } catch (error) {
            console.error('Error getting location name:', error);
            setSelectedLocation({
              name: `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              latitude: lat,
              longitude: lng
            });
            setSearchQuery(`My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
          
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location Error",
            description: "Could not retrieve your location. Please search or select a location on the map.",
            variant: "destructive",
          });
          setLoading(false);
        }
      );
    }
  };
  
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      const handleClick = (e: L.LeafletMouseEvent) => {
        handleMapClick(e);
      };
      
      map.on('click', handleClick);
      
      return () => {
        map.off('click', handleClick);
      };
    }, [map]);
    
    return null;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild id="mapSelectorTrigger">
        <Button variant="outline" className="w-full flex justify-between items-center">
          <span className="flex items-center">
            <Search className="mr-2 h-4 w-4" /> 
            Search for a Location
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Search for a location or click directly on the map to select coordinates.
          </DialogDescription>
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
                  <p className="text-sm">{suggestion.display_name}</p>
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
        
        <div className="flex gap-2 mb-4">
          <Button 
            variant="outline" 
            onClick={handleUseCurrentLocation} 
            disabled={loading} 
            className="text-xs"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Use My Location
          </Button>
        </div>
        
        <div className="flex-1 rounded-md border border-input bg-background min-h-[300px] mb-4 overflow-hidden">
          <MapContainer 
            center={position} 
            zoom={3} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <ChangeMapCenter coordinates={position} />
            <MapEvents />
          </MapContainer>
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
