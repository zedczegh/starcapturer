import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";
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

interface SIQSStore {
  score: number | null;
  setValue: (score: number | null) => void;
  getValue: () => number | null;
}

export const currentSiqsStore = create<SIQSStore>((set, get) => ({
  score: null,
  setValue: (score) => set({ score }),
  getValue: () => get().score
}));

const formSchema = z.object({
  location: z.string().min(2, {
    message: "Location must be at least 2 characters."
  })
});

const CalculatorSection = ({ noAutoLocationRequest = false }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [siqsScore, setSiqsScore] = useState(null);
  const [siqsFactors, setSiqsFactors] = useState([]);
  const [locationName, setLocationName] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [showPhotoPoints, setShowPhotoPoints] = useState(false);
  const [hasCalculatedOnce, setHasCalculatedOnce] = useState(false);
  const autoLocationRequestedRef = useRef(false);
  
  const { getPosition, loading: geoLoading, error: geoError, coords } = useGeolocation({
    enableHighAccuracy: true
  });
  
  const { loading, error, getLocationData, getLocationName, locationData, weatherData, bortleScale } = useLocationDataCache();
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: ""
    }
  });
  
  useEffect(() => {
    currentSiqsStore.setValue(siqsScore);
  }, [siqsScore]);
  
  useEffect(() => {
    if (!noAutoLocationRequest && !autoLocationRequestedRef.current && !userCoords) {
      autoLocationRequestedRef.current = true;
      const timer = setTimeout(() => {
        handleUserLocationDetect();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [noAutoLocationRequest, userCoords]);
  
  const handleLocationSubmit = async (values) => {
    try {
      const result = await getLocationData(values.location);
      if (!result) {
        toast.error(t("Location not found", "找不到位置"));
        return;
      }
      
      setLocationName(result.name);
      setUserCoords({
        latitude: result.latitude,
        longitude: result.longitude
      });
      
      const moonPhase = calculateMoonPhase();
      const siqsResult = calculateSIQS({
        cloudCover: weatherData?.cloudCover || 0,
        bortleScale: bortleScale || 4,
        seeingConditions: 3,
        windSpeed: weatherData?.windSpeed || 0,
        humidity: weatherData?.humidity || 0,
        moonPhase,
        aqi: weatherData?.aqi,
        weatherCondition: weatherData?.weatherCondition,
        precipitation: weatherData?.precipitation || 0
      });
      
      setSiqsScore(siqsResult.score);
      setSiqsFactors(siqsResult.factors);
      setHasCalculatedOnce(true);
      setShowPhotoPoints(true);
      
      saveLocation({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        bortleScale,
        siqsScore: siqsResult.score
      });
      
      if (result && result.latitude && result.longitude) {
        publishLocationUpdate({
          latitude: result.latitude,
          longitude: result.longitude,
          name: result.name || values.location
        });
      }
      
      form.reset();
    } catch (error) {
      console.error("Error getting location data:", error);
      toast.error(t("Error calculating SIQS", "计算SIQS时出错"));
    }
  };
  
  const handleUserLocationDetect = async () => {
    try {
      await getPosition();
    } catch (error) {
      console.error("Error getting user location:", error);
      toast.error(t("Could not get your location", "无法获取您的位置"));
    }
  };
  
  useEffect(() => {
    const processCoordinates = async () => {
      if (!coords) return;
      try {
        const locationName = await getLocationName(coords.latitude, coords.longitude);
        setLocationName(locationName || t("Current Location", "当前位置"));
        setUserCoords({
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        
        await getLocationData(null, coords.latitude, coords.longitude);
        
        const moonPhase = calculateMoonPhase();
        const siqsResult = calculateSIQS({
          cloudCover: weatherData?.cloudCover || 0,
          bortleScale: bortleScale || 4,
          seeingConditions: 3,
          windSpeed: weatherData?.windSpeed || 0,
          humidity: weatherData?.humidity || 0,
          moonPhase,
          aqi: weatherData?.aqi,
          weatherCondition: weatherData?.weatherCondition,
          precipitation: weatherData?.precipitation || 0
        });
        
        setSiqsScore(siqsResult.score);
        setSiqsFactors(siqsResult.factors);
        setHasCalculatedOnce(true);
        setShowPhotoPoints(true);
        
        saveLocation({
          name: locationName || t("Current Location", "当前位置"),
          latitude: coords.latitude,
          longitude: coords.longitude,
          bortleScale,
          siqsScore: siqsResult.score
        });
        
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
  
  const handleViewDetails = useCallback(() => {
    if (!userCoords || !locationData) return;
    
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
    
    navigate(`/location/${locationDetails.id}`, {
      state: locationDetails
    });
  }, [userCoords, locationData, locationName, weatherData, bortleScale, siqsScore, siqsFactors, navigate]);
  
  const siqsLevel = siqsScore !== null ? getSIQSLevel(siqsScore) : "";
  const siqsColor = siqsScore !== null ? siqsToColor(siqsScore) : "#3B82F6";
  
  return (
    <section 
      id="calculator" 
      className="py-12 px-4 md:px-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center bg-gradient-to-b from-cosmic-900/80 to-cosmic-950/80 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-star-field opacity-50 pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-cosmic-900/90 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-cosmic-950/90 to-transparent pointer-events-none"></div>
      
      <motion.div 
        className="absolute top-40 right-1/4 w-64 h-64 rounded-full bg-cosmic-glow opacity-30 pointer-events-none"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 8, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
      />
      
      <motion.div 
        className="absolute bottom-40 left-1/4 w-80 h-80 rounded-full bg-cosmic-glow opacity-30 pointer-events-none"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ 
          duration: 10, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 2
        }}
      />
      
      <motion.div 
        className="container mx-auto max-w-5xl relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="text-center mb-6"
          variants={itemVariants}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            {t("Sky Imaging Quality Score Calculator", "天空成像质量评分计算器")}
          </h2>
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="transform-gpu hover:scale-[1.01] transition-transform duration-500 relative"
        >
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-3xl -z-10 transform -translate-y-4 scale-105"></div>
          
          <SIQSCalculator 
            className="mx-auto max-w-2xl" 
            noAutoLocationRequest={noAutoLocationRequest}
            onSiqsCalculated={handleSiqsCalculated}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CalculatorSection;
