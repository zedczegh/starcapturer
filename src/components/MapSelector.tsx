
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, Loader2, Search, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { getLocationNameFromCoordinates } from '@/lib/api';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create a component to update map center
const ChangeMapCenter = ({ coordinates, mapRef }: { coordinates: [number, number], mapRef: React.RefObject<L.Map> }) => {
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(coordinates, mapRef.current.getZoom());
    }
  }, [coordinates, mapRef]);
  
  return null;
};

// Interactive map component that handles clicks
const InteractiveMap = ({ onMapClick, position }: { 
  onMapClick: (lat: number, lng: number) => void,
  position: [number, number]
}) => {
  const map = useMap();
  
  // Add click event listener to the map
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  return <Marker position={position} />;
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
  const mapRef = useRef<L.Map>(null);
  
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      // Using the BigDataCloud API as a more reliable alternative to Nominatim
      // This is a geocoding approximation - not as accurate, but more reliable
      const response = await fetch(
        `https://api.bigdatacloud.net/data/geocoding?q=${encodeURIComponent(query)}&localityLanguage=en&key=bdc_1270be2373614930a0f67fddec17c11d`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AstroSIQS-App'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location suggestions');
      }
      
      const data = await response.json();
      
      // Format the results to match our expected structure
      const formattedResults = data.results?.slice(0, 5).map((item: any) => ({
        display_name: item.locality 
          ? `${item.locality}, ${item.city || ''} ${item.countryName}`.trim() 
          : item.formattedAddress || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
        lat: item.latitude,
        lon: item.longitude
      })) || [];
      
      setSuggestions(formattedResults);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Fallback to a simpler approach - create a dummy suggestion based on the query
      // This ensures users can still proceed even if the API fails
      const dummySuggestion = {
        display_name: `Search for: ${query}`,
        lat: position[0],
        lon: position[1]
      };
      setSuggestions([dummySuggestion]);
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
  
  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // When a location is clicked on the map, fetch the location name
    fetchLocationName(lat, lng);
  };
  
  const fetchLocationName = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // Using the imported function from the API library
      const name = await getLocationNameFromCoordinates(lat, lng);
      
      setSelectedLocation({
        name,
        latitude: lat,
        longitude: lng
      });
      setSearchQuery(name);
      setLoading(false);
      
      // Automatically select location after pinpointing
      if (isOpen) {
        setTimeout(() => {
          handleSelectLocation();
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
      const fallbackName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSelectedLocation({
        name: fallbackName,
        latitude: lat,
        longitude: lng
      });
      setSearchQuery(fallbackName);
      setLoading(false);
    }
  };
  
  const handleSelectLocation = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      setIsOpen(false);
    } else if (position) {
      // If no selected location but we have a position, create one
      const locationName = searchQuery || `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`;
      const location = {
        name: locationName,
        latitude: position[0],
        longitude: position[1]
      };
      onSelectLocation(location);
      setIsOpen(false);
    }
  };
  
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setPosition([lat, lng]);
          
          try {
            // Using the imported function from the API library
            const name = await getLocationNameFromCoordinates(lat, lng);
            
            const location = {
              name,
              latitude: lat,
              longitude: lng
            };
            
            setSelectedLocation(location);
            setSearchQuery(name);
            
            // Automatically use the current location
            onSelectLocation(location);
            
            toast({
              title: "Location Found",
              description: `Using your current location: ${name}`,
            });
            
            setLoading(false);
            setIsOpen(false);
          } catch (error) {
            console.error('Error getting location name:', error);
            const fallbackName = `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            
            const location = {
              name: fallbackName,
              latitude: lat,
              longitude: lng
            };
            
            setSelectedLocation(location);
            setSearchQuery(fallbackName);
            
            // Still use the location even without a proper name
            onSelectLocation(location);
            
            setLoading(false);
            setIsOpen(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location Error",
            description: "Could not retrieve your location. Please search or select a location on the map.",
            variant: "destructive",
          });
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation. Please search or select a location on the map.",
        variant: "destructive",
      });
    }
  };
  
  // Store map reference when map is created
  const onMapCreated = (map: L.Map) => {
    mapRef.current = map;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild id="mapSelectorTrigger">
        <Button variant="outline" className="w-full flex justify-between items-center hover:bg-primary/10">
          <span className="flex items-center">
            <Search className="mr-2 h-4 w-4" /> 
            Search for a Location
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pinpoint Location</DialogTitle>
          <DialogDescription>
            Search for a location or click directly on the map to set coordinates.
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
            className="text-xs flex items-center"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
            Use My Location
          </Button>
        </div>
        
        <div className="flex-1 rounded-md border border-input bg-background min-h-[300px] mb-4 overflow-hidden glassmorphism">
          <MapContainer 
            center={position} 
            zoom={3} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            whenCreated={onMapCreated}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <InteractiveMap onMapClick={handleMapClick} position={position} />
            <ChangeMapCenter coordinates={position} mapRef={mapRef} />
          </MapContainer>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm">
            {selectedLocation ? (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-primary" />
                <span className="font-medium truncate max-w-[300px]">{selectedLocation.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Click on the map to select a location</span>
            )}
          </div>
          
          <Button onClick={handleSelectLocation} disabled={!selectedLocation && !position}>
            Use This Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapSelector;
