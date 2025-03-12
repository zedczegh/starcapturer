
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, Loader2, Search, MapPin, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { getLocationNameFromCoordinates } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Create a custom marker icon with animation
const createCustomMarker = (): L.DivIcon => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="marker-pin-container">
        <div class="marker-pin animate-bounce"></div>
        <div class="marker-shadow"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

// Interactive map component that handles clicks
const InteractiveMap = ({ onMapClick, position }: { 
  onMapClick: (lat: number, lng: number) => void,
  position: [number, number]
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);
  
  // Map events component to handle clicks
  const MapEvents = () => {
    useMapEvents({
      click: (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        onMapClick(lat, lng);
      },
    });
    
    return null;
  };
  
  // Update marker position when position prop changes
  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);
  
  // Define custom marker style with pulse effect
  useEffect(() => {
    // Add custom CSS for marker animation
    if (!document.getElementById('custom-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-marker-styles';
      style.innerHTML = `
        .custom-marker-icon {
          background: transparent;
          border: none;
        }
        .marker-pin-container {
          position: relative;
          width: 30px;
          height: 42px;
        }
        .marker-pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: #9b87f5;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -12px;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }
        .marker-pin::after {
          content: '';
          width: 14px;
          height: 14px;
          margin: 5px 0 0 5px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }
        .marker-shadow {
          width: 24px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0,0,0,0.15);
          position: absolute;
          left: 50%;
          top: 100%;
          margin: -6px 0 0 -12px;
          transform: rotateX(55deg);
          z-index: -1;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(155, 135, 245, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(155, 135, 245, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(155, 135, 245, 0);
          }
        }
        .animate-bounce {
          animation: pulse 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  return (
    <MapContainer 
      center={position} 
      zoom={3} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker 
        position={markerPosition} 
        icon={createCustomMarker()}
      />
      <ChangeMapCenter coordinates={position} mapRef={mapRef} />
      <MapEvents />
    </MapContainer>
  );
};

interface MapSelectorProps {
  onSelectLocation: (location: { name: string; latitude: number; longitude: number }) => void;
  children?: React.ReactNode;
}

// Location suggestion interface
interface LocationSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  place_type?: string;
  country?: string;
  population?: number;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectLocation, children }) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<[number, number]>([39.9042, 116.4074]);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<L.Map>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search for locations with the given query
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      // First try with Nominatim OpenStreetMap API which provides more detailed results
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=${language}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AstroSIQS-App'
          }
        }
      );
      
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        
        if (Array.isArray(nominatimData) && nominatimData.length > 0) {
          const formattedResults = nominatimData.map((item: any) => {
            // Extract relevant information for display
            const displayName = item.display_name;
            const placeType = item.type || '';
            const country = item.address?.country || '';
            
            return {
              display_name: displayName,
              place_type: placeType,
              country: country,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            };
          });
          
          setSuggestions(formattedResults);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to BigDataCloud if Nominatim fails
      const response = await fetch(
        `https://api.bigdatacloud.net/data/geocoding-reversegeocode?q=${encodeURIComponent(query)}&localityLanguage=${language}`,
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
      
      const formattedResults = data.results?.slice(0, 5).map((item: any) => ({
        display_name: item.locality 
          ? `${item.locality}, ${item.city || ''} ${item.countryName}`.trim() 
          : item.formattedAddress || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
        lat: item.latitude,
        lon: item.longitude,
        country: item.countryName
      })) || [];
      
      setSuggestions(formattedResults);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      
      // Add a descriptive search suggestion even when API fails
      const descriptionSuggestion: LocationSuggestion = {
        display_name: `${t("Search for", "搜索")}: ${query}`,
        lat: position[0],
        lon: position[1]
      };
      
      // Try fallback with fallback geocoder
      try {
        const fallbackResponse = await fetch(
          `https://geocode.maps.co/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'AstroSIQS-App'
            }
          }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const formattedResults = fallbackData.map((item: any) => ({
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            }));
            setSuggestions(formattedResults);
          } else {
            setSuggestions([descriptionSuggestion]);
          }
        } else {
          setSuggestions([descriptionSuggestion]);
        }
      } catch (fallbackError) {
        console.error('Error using fallback geocoder:', fallbackError);
        setSuggestions([descriptionSuggestion]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.trim() && query.length >= 2) {
      // Set new timeout for search
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(query);
      }, 500);
    } else {
      setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setLoading(true);
    
    const location = {
      name: suggestion.display_name,
      latitude: parseFloat(suggestion.lat.toString()),
      longitude: parseFloat(suggestion.lon.toString())
    };
    
    setSelectedLocation(location);
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    setPosition([location.latitude, location.longitude]);
    
    // Show confirmation feedback
    toast({
      title: t("Location Selected", "已选择位置"),
      description: suggestion.display_name,
    });
    
    setLoading(false);
  };
  
  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setLoading(true);
    
    try {
      const name = await getLocationNameFromCoordinates(lat, lng, language);
      
      if (!name || name.trim() === '') {
        throw new Error('Empty location name received');
      }
      
      const newLocation = {
        name,
        latitude: lat,
        longitude: lng
      };
      
      setSelectedLocation(newLocation);
      setSearchQuery(name);
      
      // Provide visual feedback that location was selected
      toast({
        title: t("Location Selected", "已选择位置"),
        description: name,
      });
    } catch (error) {
      console.error('Error fetching location name:', error);
      const fallbackName = t(
        `Location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
        `位置：${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
      );
      
      const newLocation = {
        name: fallbackName,
        latitude: lat,
        longitude: lng
      };
      
      setSelectedLocation(newLocation);
      setSearchQuery(fallbackName);
      
      toast({
        title: t("Location Error", "位置错误"),
        description: t(
          "Could not get location name. Using coordinates instead.",
          "无法获取位置名称。使用坐标代替。"
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            const name = await getLocationNameFromCoordinates(lat, lng, language);
            
            const location = {
              name,
              latitude: lat,
              longitude: lng
            };
            
            setSelectedLocation(location);
            setSearchQuery(name);
            
            toast({
              title: t("Location Found", "已找到位置"),
              description: t(`Using your current location: ${name}`, `使用您的当前位置: ${name}`),
            });
          } catch (error) {
            console.error('Error getting location name:', error);
            const fallbackName = t(
              `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 
              `我的位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            );
            
            const location = {
              name: fallbackName,
              latitude: lat,
              longitude: lng
            };
            
            setSelectedLocation(location);
            setSearchQuery(fallbackName);
            
            toast({
              title: t("Location Error", "位置错误"),
              description: t(
                "Could not retrieve location name. Using coordinates instead.",
                "无法获取位置名称。使用坐标代替。"
              ),
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: t("Location Error", "位置错误"),
            description: t(
              "Could not retrieve your location. Please search or select a location on the map.",
              "无法获取您的位置，请搜索或在地图上选择位置。"
            ),
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
        title: t("Geolocation Not Supported", "不支持地理位置"),
        description: t(
          "Your browser doesn't support geolocation. Please search or select a location on the map.",
          "您的浏览器不支持地理位置，请搜索或在地图上选择位置。"
        ),
        variant: "destructive",
      });
    }
  };
  
  const handleCenterOnSelection = () => {
    if (selectedLocation) {
      setPosition([selectedLocation.latitude, selectedLocation.longitude]);
      toast({
        title: t("Map Centered", "地图已居中"),
        description: selectedLocation.name,
      });
    }
  };
  
  const renderSuggestionDetails = (suggestion: LocationSuggestion) => {
    const details = [];
    
    if (suggestion.place_type) {
      details.push(t(suggestion.place_type, suggestion.place_type));
    }
    
    if (suggestion.country) {
      details.push(suggestion.country);
    }
    
    return details.length > 0 ? details.join(' • ') : null;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild id="mapSelectorTrigger">
        {children || (
          <Button variant="outline" className="w-full flex justify-between items-center hover:bg-primary/10">
            <span className="flex items-center">
              <Search className="mr-2 h-4 w-4" /> 
              {t("Search for a Location", "搜索位置")}
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("Pinpoint Location", "定位位置")}</DialogTitle>
          <DialogDescription>
            {t(
              "Search for a location or click directly on the map to set coordinates.",
              "搜索位置或直接点击地图设置坐标。"
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t("Type at least 2 characters to search...", "输入至少2个字符以搜索...")}
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
              {suggestions.map((suggestion, index) => {
                const details = renderSuggestionDetails(suggestion);
                
                return (
                  <div
                    key={index}
                    className="px-4 py-2 cursor-pointer hover:bg-accent border-b border-border last:border-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <p className="text-sm font-medium">{suggestion.display_name}</p>
                    {details && (
                      <p className="text-xs text-muted-foreground mt-0.5">{details}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {loading && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant="outline" 
            onClick={handleUseCurrentLocation} 
            disabled={loading} 
            className="text-xs flex items-center"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
            {t("Use My Location", "使用我的位置")}
          </Button>
          
          {selectedLocation && (
            <Button 
              variant="outline" 
              onClick={handleCenterOnSelection} 
              className="text-xs flex items-center"
            >
              <Crosshair className="h-3 w-3 mr-1" />
              {t("Center on Selection", "居中所选位置")}
            </Button>
          )}
        </div>
        
        <div className="flex-1 rounded-md border border-input bg-background min-h-[300px] mb-4 overflow-hidden glassmorphism">
          <InteractiveMap onMapClick={handleMapClick} position={position} />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm">
            {selectedLocation ? (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-primary" />
                <span className="font-medium truncate max-w-[300px]">{selectedLocation.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {t("Click on the map to select a location", "点击地图选择位置")}
              </span>
            )}
          </div>
          
          <Button 
            onClick={() => {
              if (selectedLocation) {
                onSelectLocation(selectedLocation);
                setIsOpen(false);
                
                // Provide confirmation feedback
                toast({
                  title: t("Location Confirmed", "位置已确认"),
                  description: selectedLocation.name,
                });
              }
            }} 
            disabled={!selectedLocation && !position}
            className={selectedLocation ? "bg-primary animate-pulse" : ""}
          >
            {t("Use This Location", "使用此位置")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapSelector;
