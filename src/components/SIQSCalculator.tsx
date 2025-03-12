
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { fetchWeatherData, getLocationNameFromCoordinates } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { MapPin, Search, Loader2 } from "lucide-react";
import MapSelector from "./MapSelector";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";

interface SIQSCalculatorProps {
  className?: string;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ className }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bortleScale, setBortleScale] = useState(4);
  const [seeingConditions, setSeeingConditions] = useState(2);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [askedForLocation, setAskedForLocation] = useState(false);
  
  // Ask for user location on initial load
  useEffect(() => {
    if (!askedForLocation) {
      setAskedForLocation(true);
      
      // Ask the user if they want to share their location
      if (window.confirm("Would you like to share your location to calculate your local SIQS and see nearby photo points?")) {
        handleUseCurrentLocation();
      }
    }
  }, []);
  
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setUserLocation({ latitude: lat, longitude: lng });
          
          try {
            const name = await getLocationNameFromCoordinates(lat, lng);
            setLocationName(name);
            
            toast({
              title: "Location Retrieved",
              description: "Your current location has been added.",
            });
            
            // Automatically calculate SIQS after getting location
            await calculateSIQSForLocation(lat, lng, name);
          } catch (error) {
            console.error("Error getting location name:", error);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          toast({
            title: "Location Error",
            description: "Could not retrieve your location. Please enter coordinates manually.",
            variant: "destructive",
          });
          console.error("Geolocation error:", error);
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
        description: "Your browser doesn't support geolocation. Please enter coordinates manually.",
        variant: "destructive",
      });
    }
  };
  
  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    setLocationName(location.name);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    
    toast({
      title: "Location Selected",
      description: `Selected ${location.name}`,
    });
    
    // Automatically calculate SIQS after selecting location
    calculateSIQSForLocation(location.latitude, location.longitude, location.name);
  };
  
  const handleRecommendedPointSelect = (point: { name: string; latitude: number; longitude: number }) => {
    setLocationName(point.name);
    setLatitude(point.latitude.toFixed(6));
    setLongitude(point.longitude.toFixed(6));
    
    // Automatically calculate for recommended points
    calculateSIQSForLocation(point.latitude, point.longitude, point.name);
  };
  
  const validateInputs = (): boolean => {
    if (!locationName.trim()) {
      toast({
        title: "Input Error",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return false;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast({
        title: "Input Error",
        description: "Please enter a valid latitude (-90 to 90).",
        variant: "destructive",
      });
      return false;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast({
        title: "Input Error",
        description: "Please enter a valid longitude (-180 to 180).",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const calculateSIQSForLocation = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    
    try {
      const weatherData = await fetchWeatherData({
        latitude: lat,
        longitude: lng,
      });
      
      if (!weatherData) {
        setLoading(false);
        return;
      }
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale,
        seeingConditions,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
      });
      
      const locationId = Date.now().toString();
      
      const locationData = {
        id: locationId,
        name: name,
        latitude: lat,
        longitude: lng,
        bortleScale,
        seeingConditions,
        weatherData,
        siqsResult,
        timestamp: new Date().toISOString(),
      };
      
      navigate(`/location/${locationId}`, { state: locationData });
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      toast({
        title: "Calculation Error",
        description: "An error occurred while calculating SIQS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCalculate = () => {
    if (!validateInputs()) return;
    calculateSIQSForLocation(parseFloat(latitude), parseFloat(longitude), locationName);
  };
  
  return (
    <div className={`glassmorphism rounded-xl p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-6">Calculate Stellar Imaging Quality Score</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-3">
          <Button 
            variant="default" 
            type="button" 
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Use My Location
          </Button>
          
          <div className="relative">
            <Button
              variant="outline"
              className="w-full flex justify-between items-center"
              onClick={() => document.getElementById('mapSelectorTrigger')?.click()}
            >
              <span className="flex items-center">
                <Search className="mr-2 h-4 w-4" /> 
                Search for a Location
              </span>
            </Button>
            <div className="hidden">
              <MapSelector onSelectLocation={handleLocationSelect} />
            </div>
          </div>
        </div>
        
        <div className="pt-2 pb-2">
          <hr className="border-cosmic-800/30" />
        </div>
        
        <RecommendedPhotoPoints 
          onSelectPoint={handleRecommendedPointSelect}
          userLocation={userLocation}
        />
        
        {locationName && (
          <div>
            <Label htmlFor="locationName">Selected Location</Label>
            <div className="flex gap-2 mt-1.5 items-center">
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleCalculate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Go"
                )}
              </Button>
            </div>
            
            <div className="hidden">
              <div>
                <Label htmlFor="bortleScale">Bortle Scale</Label>
                <Slider
                  id="bortleScale"
                  min={1}
                  max={9}
                  step={1}
                  value={[bortleScale]}
                  onValueChange={(value) => setBortleScale(value[0])}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="seeingConditions">Seeing Conditions</Label>
                <Slider
                  id="seeingConditions"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[seeingConditions]}
                  onValueChange={(value) => setSeeingConditions(value[0])}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SIQSCalculator;
