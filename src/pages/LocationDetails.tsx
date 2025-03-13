
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import LocationError from "@/components/location/LocationError";
import LocationContent from "@/components/location/LocationContent";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useLocationDetails } from "@/hooks/useLocationDetails";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState<any>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isMobile = window.innerWidth < 768;

  const {
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    setGettingUserLocation,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
  } = useLocationDetails(locationData, setLocationData);

  useEffect(() => {
    if (!locationData && location.state) {
      console.log("Setting location data from state:", location.state);
      setLocationData(location.state);
      
      if (!location.state?.latitude || !location.state?.longitude) {
        toast({
          title: t("Error", "错误"),
          description: t("Incomplete location data", "位置数据不完整"),
          variant: "destructive"
        });
        
        const redirectTimer = setTimeout(() => {
          navigate("/");
        }, 2000);
        
        return () => clearTimeout(redirectTimer);
      }
    } else if (!locationData && !location.state) {
      console.error("Location data is missing", { params: id, locationState: location.state });
      
      toast({
        title: t("Error", "错误"),
        description: t("Location data not found", "找不到位置数据"),
        variant: "destructive"
      });
    }
  }, [locationData, location.state, navigate, t, id, toast]);

  const handleLocationUpdate = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    setLoading(true);
    try {
      const weatherData = await fetchWeatherData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      if (!weatherData) {
        throw new Error("Failed to retrieve weather data for this location");
      }

      let bortleScale = locationData?.bortleScale || 4;
      try {
        const bortleData = await fetchLightPollutionData(newLocation.latitude, newLocation.longitude);
        if (bortleData?.bortleScale) {
          bortleScale = bortleData.bortleScale;
        }
      } catch (lightError) {
        console.error("Error fetching light pollution data during location update:", lightError);
        // Continue with existing or default bortle scale
      }
      
      const moonPhase = locationData?.moonPhase || 0;
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale: bortleScale,
        seeingConditions: locationData?.seeingConditions || 3,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
        aqi: weatherData.aqi,
        weatherCondition: weatherData.weatherCondition,
        precipitation: weatherData.precipitation
      });

      const updatedLocationData = {
        ...locationData,
        ...newLocation,
        weatherData,
        bortleScale,
        siqsResult,
        timestamp: new Date().toISOString()
      };

      setLocationData(updatedLocationData);

      try {
        const forecast = await fetchForecastData({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        });
        
        setForecastData(forecast);
      } catch (forecastError) {
        console.error("Error fetching forecast during location update:", forecastError);
        // Continue without setting forecast data
      }

      const newLocationId = Date.now().toString();
      
      navigate(`/location/${newLocationId}`, { 
        state: updatedLocationData,
        replace: true 
      });

      setStatusMessage(t("SIQS score has been recalculated for the new location.", 
                     "已为新位置重新计算SIQS评分。"));
      
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location and recalculate SIQS score. Please try again.", 
                     "无法更新位置并重新计算SIQS评分。请重试。"));
    } finally {
      setLoading(false);
    }
  };

  // Fix for missing functions in the refactored code
  const fetchLightPollutionData = async (lat: number, lon: number) => {
    try {
      const { fetchLightPollutionData } = await import("@/lib/api");
      return fetchLightPollutionData(lat, lon);
    } catch (error) {
      console.error("Error importing fetchLightPollutionData:", error);
      return null;
    }
  };

  const fetchForecastData = async (params: any) => {
    try {
      const { fetchForecastData } = await import("@/lib/api");
      return fetchForecastData(params);
    } catch (error) {
      console.error("Error importing fetchForecastData:", error);
      return null;
    }
  };

  if (!locationData) {
    return <LocationError />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden sci-fi-scrollbar pb-16 md:pb-0">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-28 pb-16">
        <StatusMessage 
          message={statusMessage} 
          onClear={() => setStatusMessage(null)} 
        />
        
        <LocationHeader 
          name={locationData.name}
          latitude={locationData.latitude}
          longitude={locationData.longitude}
          timestamp={locationData.timestamp}
          loading={loading}
          onRefresh={handleRefreshAll}
        />
        
        <LocationContent 
          locationData={locationData}
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          gettingUserLocation={gettingUserLocation}
          onLocationUpdate={handleLocationUpdate}
          setGettingUserLocation={setGettingUserLocation}
          setStatusMessage={setStatusMessage}
          onRefreshForecast={handleRefreshForecast}
          onRefreshLongRange={handleRefreshLongRangeForecast}
        />
      </main>
    </div>
  );
};

export default LocationDetails;
