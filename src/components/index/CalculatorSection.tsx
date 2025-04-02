import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { useLocationDataCache } from "@/hooks/useLocationData"; // Fixed import
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { formatSIQSScore } from "@/lib/siqs/utils";
import { getSIQSLevel } from "@/lib/siqs/utils";
import { siqsToColor } from "@/lib/siqs/utils";
import { saveLocation } from "@/utils/locationStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, Search, Star, ArrowRight } from "lucide-react";
import SIQSFactorsList from "@/components/siqs/SIQSFactorsList";
import SIQSGauge from "@/components/siqs/SIQSGauge";
import RecommendedPhotoPoints from "@/components/RecommendedPhotoPoints";
import { create } from "zustand";
import { publishLocationUpdate } from '@/services/locationSyncService';

// Store for current SIQS score to share between components
interface SIQSStore {
  score: number | null;
  setScore: (score: number | null) => void;
  getScore: () => number | null;
}

export const currentSiqsStore = create<SIQSStore>((set, get) => ({
  score: null,
  setScore: (score) => set({ score }),
  getScore: () => get().score,
}));

// Form schema
const formSchema = z.object({
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
});

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ noAutoLocationRequest = false }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const [siqsFactors, setSiqsFactors] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>("");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPhotoPoints, setShowPhotoPoints] = useState(false);
  const [hasCalculatedOnce, setHasCalculatedOnce] = useState(false);
  const autoLocationRequestedRef = useRef(false);
  
  // Set up geolocation hook
  const { getPosition, loading: geoLoading, error: geoError, coords } = useGeolocation({
    enableHighAccuracy: true,
  });
  
  // Set up location data hook - fixed the import and usage
  const { 
    loading, 
    error, 
    getLocationData, 
    getLocationName,
    locationData,
    weatherData,
    bortleScale
  } = useLocationDataCache();
  
  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
    },
  });
  
  // Update the global SIQS store when score changes
  useEffect(() => {
    currentSiqsStore.setScore(siqsScore);
  }, [siqsScore]);
  
  // Auto-request location if enabled
  useEffect(() => {
    if (!noAutoLocationRequest && !autoLocationRequestedRef.current && !userCoords) {
      autoLocationRequestedRef.current = true;
      
      // Small delay to avoid overwhelming the user with permission dialogs
      const timer = setTimeout(() => {
        handleUserLocationDetect();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [noAutoLocationRequest, userCoords]);
  
  // Handle form submission
  const handleLocationSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await getLocationData(values.location);
      
      if (!result) {
        toast.error(t("Location not found", "找不到位置"));
        return;
      }
      
      // Update UI with location data
      setLocationName(result.name);
      setUserCoords({ latitude: result.latitude, longitude: result.longitude });
      
      // Modified: Check if cloud cover is 100% and set a random lower score between 1.1-1.3
      const cloudCover = weatherData?.cloudCover || 0;
      const moonPhase = calculateMoonPhase();
      
      let siqsResult;
      if (cloudCover === 100) {
        // Generate a random score between 1.1 and 1.3 for 100% cloud cover
        const randomScore = 1.1 + (Math.random() * 0.2);
        siqsResult = {
          score: randomScore,
          factors: [
            {
              name: "Cloud Cover",
              score: 1.5, // Very low score for cloud cover
              description: t("Complete cloud cover severely limits visibility", "云层完全覆盖严重限制了可见度")
            }
          ]
        };
      } else {
        // Normal SIQS calculation for other cases
        siqsResult = calculateSIQS({
          cloudCover: cloudCover,
          bortleScale: bortleScale || 4,
          seeingConditions: 3, // Default seeing conditions
          windSpeed: weatherData?.windSpeed || 0,
          humidity: weatherData?.humidity || 0,
          moonPhase,
          aqi: weatherData?.aqi,
          weatherCondition: weatherData?.weatherCondition,
          precipitation: weatherData?.precipitation || 0
        });
      }
      
      // Update state with results
      setSiqsScore(siqsResult.score);
      setSiqsFactors(siqsResult.factors);
      setHasCalculatedOnce(true);
      setShowPhotoPoints(true);
      
      // Save location for future use (fixed property name)
      saveLocation({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        bortleScale,
        siqsScore: siqsResult.score // Changed from 'siqs' to 'siqsScore'
      });

      // After successful location update:
      if (result && result.latitude && result.longitude) {
        // Publish location update to sync service
        publishLocationUpdate({
          latitude: result.latitude,
          longitude: result.longitude,
          name: result.name || values.location
        });
      }
      
      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error getting location data:", error);
      toast.error(t("Error calculating SIQS", "计算SIQS时出错"));
    }
  };
  
  // Handle user location detection
  const handleUserLocationDetect = async () => {
    try {
      await getPosition();
    } catch (error) {
      console.error("Error getting user location:", error);
      toast.error(t("Could not get your location", "无法获取您的位置"));
    }
  };
  
  // Process coordinates when available
  useEffect(() => {
    const processCoordinates = async () => {
      if (!coords) return;
      
      try {
        // Get location name from coordinates
        const locationName = await getLocationName(coords.latitude, coords.longitude);
        setLocationName(locationName || t("Current Location", "当前位置"));
        setUserCoords({ latitude: coords.latitude, longitude: coords.longitude });
        
        // Get weather and light pollution data
        await getLocationData(null, coords.latitude, coords.longitude);
        
        // Modified: Check if cloud cover is 100% and set a random lower score between 1.1-1.3
        const cloudCover = weatherData?.cloudCover || 0;
        const moonPhase = calculateMoonPhase();
        
        let siqsResult;
        if (cloudCover === 100) {
          // Generate a random score between 1.1 and 1.3 for 100% cloud cover
          const randomScore = 1.1 + (Math.random() * 0.2);
          siqsResult = {
            score: randomScore,
            factors: [
              {
                name: "Cloud Cover",
                score: 1.5, // Very low score for cloud cover
                description: t("Complete cloud cover severely limits visibility", "云层完全覆盖严重限制了可见度")
              }
            ]
          };
        } else {
          // Normal SIQS calculation for other cases
          siqsResult = calculateSIQS({
            cloudCover: cloudCover,
            bortleScale: bortleScale || 4,
            seeingConditions: 3, // Default seeing conditions
            windSpeed: weatherData?.windSpeed || 0,
            humidity: weatherData?.humidity || 0,
            moonPhase,
            aqi: weatherData?.aqi,
            weatherCondition: weatherData?.weatherCondition,
            precipitation: weatherData?.precipitation || 0
          });
        }
        
        // Update state with results
        setSiqsScore(siqsResult.score);
        setSiqsFactors(siqsResult.factors);
        setHasCalculatedOnce(true);
        setShowPhotoPoints(true);
        
        // Save location for future use (fixed property name)
        saveLocation({
          name: locationName || t("Current Location", "当前位置"),
          latitude: coords.latitude,
          longitude: coords.longitude,
          bortleScale,
          siqsScore: siqsResult.score // Changed from 'siqs' to 'siqsScore'
        });
        
        // Publish location update
        publishLocationUpdate({
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: locationName || "Current Location"
        });
      } catch (error) {
        console.error("Error processing coordinates:", error);
        toast.error(t("Error calculating SIQS", "计算SIQS时出错"));
      }
    };
    
    if (coords) {
      processCoordinates();
    }
  }, [coords, getLocationName, getLocationData, weatherData, bortleScale, t]);
  
  // Handle view details button click
  const handleViewDetails = useCallback(() => {
    if (!userCoords || !locationData) return;
    
    // Create location data object
    const locationDetails = {
      id: `${userCoords.latitude}-${userCoords.longitude}`,
      name: locationName,
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      timestamp: new Date().toISOString(),
      weatherData,
      bortleScale,
      moonPhase: calculateMoonPhase(),
      siqsResult: {
        score: siqsScore,
        factors: siqsFactors
      },
      fromCalculator: true
    };
    
    // Navigate to location details page
    navigate(`/location/${locationDetails.id}`, { state: locationDetails });
  }, [userCoords, locationData, locationName, weatherData, bortleScale, siqsScore, siqsFactors, navigate]);
  
  // Get SIQS level and color
  const siqsLevel = siqsScore !== null ? getSIQSLevel(siqsScore) : "";
  const siqsColor = siqsScore !== null ? siqsToColor(siqsScore) : "#3B82F6";
  
  return (
    <section id="calculator" className="py-16 bg-cosmic-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6">
            <Star className="h-3.5 w-3.5 text-primary mr-2" />
            <span className="text-xs font-medium text-primary">
              {t("SIQS Calculator", "SIQS计算器")}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">
            {t("Check Your ", "查看您的")}
            <span className="text-gradient-blue">
              {t("Viewing Conditions", "观测条件")}
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl">
            {t(
              "Enter your location to calculate the Stellar Imaging Quality Score (SIQS). This score helps you determine if tonight is good for astrophotography.",
              "输入您的位置以计算恒星成像质量评分（SIQS）。此评分可帮助您确定今晚是否适合天文摄影。"
            )}
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="bg-cosmic-800/50 border-cosmic-700">
            <CardHeader>
              <CardTitle className="text-center">
                {t("Stellar Imaging Quality Score", "恒星成像质量评分")}
              </CardTitle>
              <CardDescription className="text-center">
                {t(
                  "Find out if conditions are good for astrophotography tonight",
                  "了解今晚的条件是否适合天文摄影"
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleLocationSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  placeholder={t("Enter location (city, address)", "输入位置（城市，地址）")}
                                  {...field}
                                  className="bg-cosmic-700/50 border-cosmic-600"
                                />
                                <Button type="submit" disabled={loading}>
                                  {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Search className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleUserLocationDetect}
                        disabled={geoLoading}
                      >
                        {geoLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-2" />
                        )}
                        {t("Use My Location", "使用我的位置")}
                      </Button>
                    </form>
                  </Form>
                  
                  {siqsScore !== null && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">
                            {locationName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("Current Conditions", "当前条件")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewDetails}
                          className="flex items-center gap-1"
                        >
                          {t("View Details", "查看详情")}
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                      
                      <SIQSFactorsList factors={siqsFactors} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-start">
                  <SIQSGauge
                    score={siqsScore}
                    level={siqsLevel}
                    color={siqsColor}
                    loading={loading || geoLoading}
                    hasCalculatedOnce={hasCalculatedOnce}
                  />
                  
                  {siqsScore !== null && (
                    <div className="mt-4 text-center">
                      <p className="text-sm">
                        {t(
                          "SIQS Score indicates if tonight is good for astrophotography at your location.",
                          "SIQS评分表明今晚在您的位置是否适合天文摄影。"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            {showPhotoPoints && userCoords && (
              <CardFooter className="flex flex-col">
                <div className="w-full pt-4 border-t border-cosmic-700">
                  <h3 className="text-lg font-medium mb-3">
                    {t("Recommended Photo Points Nearby", "附近推荐的摄影点")}
                  </h3>
                  <RecommendedPhotoPoints
                    userLocation={userCoords}
                    onSelectPoint={(point) => {
                      navigate(`/location/${point.id}`, { 
                        state: {
                          id: point.id,
                          name: language === 'en' ? point.name : (point.chineseName || point.name),
                          latitude: point.latitude,
                          longitude: point.longitude,
                          timestamp: new Date().toISOString(),
                          fromPhotoPoints: true
                        }
                      });
                    }}
                  />
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;
