
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { fetchWeatherData, getLocationNameFromCoordinates } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { MapPin, Search, Loader2, Info, SlidersHorizontal } from "lucide-react";
import MapSelector from "./MapSelector";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
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
            
            // Don't automatically calculate SIQS after getting location
            // Let user adjust settings first
            setLoading(false);
          } catch (error) {
            console.error("Error getting location name:", error);
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
    
    // Don't automatically calculate SIQS after selecting location
    // Let user adjust settings first
  };
  
  const handleRecommendedPointSelect = (point: { name: string; latitude: number; longitude: number }) => {
    setLocationName(point.name);
    setLatitude(point.latitude.toFixed(6));
    setLongitude(point.longitude.toFixed(6));
    
    // Don't automatically calculate for recommended points
    // Let user adjust settings first
    toast({
      title: "Location Selected",
      description: `Selected ${point.name}`,
    });
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
  
  // Calculate current moon phase (simplified approximation)
  const getCurrentMoonPhase = (): number => {
    // Simple approximation based on current date
    // In a real app, this would use astronomical calculations
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Simple algorithm to approximate moon phase
    // 0 = new, 0.5 = full, 1 = new (next cycle)
    const c = 365.25 * year;
    const e = 30.6 * month;
    const jd = c + e + day - 694039.09; // Julian date
    const moonPhase = (jd % 29.53) / 29.53;
    
    return moonPhase;
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
      
      // Get current moon phase
      const moonPhase = getCurrentMoonPhase();
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale,
        seeingConditions,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
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
        moonPhase,
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

  // Bortle scale descriptions for tooltips
  const getBortleScaleDescription = (value: number): string => {
    const descriptions = [
      "1: Excellent dark-sky site, no light pollution",
      "2: Typical truly dark site, Milky Way casts shadows",
      "3: Rural sky, some light pollution but Milky Way still visible",
      "4: Rural/suburban transition, Milky Way visible but lacks detail",
      "5: Suburban sky, Milky Way very dim or invisible",
      "6: Bright suburban sky, no Milky Way, only brightest constellations visible",
      "7: Suburban/urban transition, most stars washed out",
      "8: Urban sky, few stars visible, planets still visible",
      "9: Inner-city sky, only brightest stars and planets visible"
    ];
    return descriptions[value - 1] || "Unknown";
  };

  // Seeing conditions descriptions for tooltips
  const getSeeingDescription = (value: number): string => {
    const descriptions = [
      "1: Perfect seeing, stars perfectly still",
      "1.5: Excellent seeing, stars mostly still",
      "2: Good seeing, slight twinkling",
      "2.5: Average seeing, moderate twinkling",
      "3: Fair seeing, noticeable twinkling",
      "3.5: Below average seeing, significant twinkling",
      "4: Poor seeing, constant twinkling",
      "4.5: Very poor seeing, images blurry",
      "5: Terrible seeing, imaging nearly impossible"
    ];
    
    // Map the value (1-5, steps of 0.5) to index (0-8)
    const index = Math.round((value - 1) * 2);
    return descriptions[index] || "Unknown";
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
          <div className="space-y-4">
            <Label htmlFor="locationName">Selected Location</Label>
            <div className="flex gap-2 mt-1.5 items-center">
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
            </div>
            
            <Collapsible
              open={showAdvancedSettings}
              onOpenChange={setShowAdvancedSettings}
              className="mt-4 border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Observation Settings</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="bortleScale" className="text-sm">
                      Bortle Scale (Light Pollution)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="w-80">
                          <p>The Bortle scale measures the night sky's brightness, with 1 being darkest and 9 brightest. Urban areas typically range from 7-9.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="bortleScale"
                      min={1}
                      max={9}
                      step={1}
                      value={[bortleScale]}
                      onValueChange={(value) => setBortleScale(value[0])}
                      className="flex-1"
                    />
                    <span className="bg-background w-8 text-center">
                      {bortleScale}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getBortleScaleDescription(bortleScale)}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="seeingConditions" className="text-sm">
                      Seeing Conditions (Atmospheric Stability)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="w-80">
                          <p>Seeing conditions rate atmospheric turbulence from 1 (perfectly stable) to 5 (highly unstable). Affects image sharpness and detail.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="seeingConditions"
                      min={1}
                      max={5}
                      step={0.5}
                      value={[seeingConditions]}
                      onValueChange={(value) => setSeeingConditions(value[0])}
                      className="flex-1"
                    />
                    <span className="bg-background w-8 text-center">
                      {seeingConditions}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSeeingDescription(seeingConditions)}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Calculate SIQS Score"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SIQSCalculator;
