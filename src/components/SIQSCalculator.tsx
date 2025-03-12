
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { fetchWeatherData, getLocationNameFromCoordinates } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { MapPin, Calculator, Loader2 } from "lucide-react";

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
  
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          
          try {
            // Get location name from coordinates
            const name = await getLocationNameFromCoordinates(lat, lng);
            setLocationName(name);
            
            toast({
              title: "Location Retrieved",
              description: "Your current location has been added.",
            });
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
  
  const handleCalculate = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    
    try {
      // Fetch weather data
      const weatherData = await fetchWeatherData({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      
      if (!weatherData) {
        setLoading(false);
        return;
      }
      
      // Calculate SIQS
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale,
        seeingConditions,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
      });
      
      // Generate a unique ID for this location
      const locationId = Date.now().toString();
      
      // In a real app, we would store this in a database or local storage
      const locationData = {
        id: locationId,
        name: locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        bortleScale,
        seeingConditions,
        weatherData,
        siqsResult,
        timestamp: new Date().toISOString(),
      };
      
      // For now, we'll just navigate to the details page with this data as state
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
  
  return (
    <div className={`glassmorphism rounded-xl p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-6">Calculate Stellar Imaging Quality Score</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="locationName">Location Name</Label>
          <Input
            id="locationName"
            placeholder="e.g., Atacama Desert Viewpoint"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="mt-1.5"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              placeholder="-23.4567"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              placeholder="-69.2344"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        
        <Button 
          variant="outline" 
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
          Use Current Location
        </Button>
        
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="bortleScale">Bortle Scale (Light Pollution)</Label>
            <span className="text-sm text-muted-foreground">{bortleScale}</span>
          </div>
          <Slider
            id="bortleScale"
            min={1}
            max={9}
            step={1}
            value={[bortleScale]}
            onValueChange={(value) => setBortleScale(value[0])}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Darkest (1)</span>
            <span>Brightest (9)</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="seeingConditions">Seeing Conditions (arcseconds)</Label>
            <span className="text-sm text-muted-foreground">{seeingConditions}</span>
          </div>
          <Slider
            id="seeingConditions"
            min={1}
            max={5}
            step={0.5}
            value={[seeingConditions]}
            onValueChange={(value) => setSeeingConditions(value[0])}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Excellent (1)</span>
            <span>Poor (5)</span>
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleCalculate}
          disabled={loading}
          className="w-full mt-2"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          Calculate SIQS
        </Button>
      </div>
    </div>
  );
};

export default SIQSCalculator;
