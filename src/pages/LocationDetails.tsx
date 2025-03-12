import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import LocationHeader from "@/components/location/LocationHeader";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import LocationMap from "@/components/LocationMap";
import ForecastTable from "@/components/ForecastTable";
import { toast } from "@/components/ui/use-toast";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData, fetchForecastData, determineWeatherCondition } from "@/lib/api";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState(location.state || null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    if (!locationData) {
      toast({
        title: "Location Not Found",
        description: "The requested location information is not available or has expired.",
        variant: "destructive",
      });
      
      const redirectTimer = setTimeout(() => {
        navigate("/");
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    } else {
      fetchLocationForecast();
    }
  }, [locationData, navigate]);

  const fetchLocationForecast = async () => {
    if (!locationData) return;
    
    setForecastLoading(true);
    try {
      const forecast = await fetchForecastData({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
      
      setForecastData(forecast);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      setForecastLoading(false);
    }
  };

  const handleLocationUpdate = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    setLoading(true);
    try {
      const weatherData = await fetchWeatherData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      const moonPhase = locationData.moonPhase || 0;
      
      const siqsResult = calculateSIQS({
        cloudCover: weatherData.cloudCover,
        bortleScale: locationData.bortleScale,
        seeingConditions: locationData.seeingConditions,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        moonPhase,
      });

      setLocationData({
        ...locationData,
        ...newLocation,
        weatherData,
        siqsResult,
      });

      const forecast = await fetchForecastData({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
      setForecastData(forecast);

      toast({
        title: "Location Updated",
        description: "SIQS score has been recalculated for the new location.",
      });
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Update Error",
        description: "Failed to update location and recalculate SIQS score.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const siqsResult = locationData?.siqsResult || { 
    score: 0, 
    factors: [], 
    isViable: false 
  };
  
  const weatherData = {
    temperature: locationData?.weatherData?.temperature || 0,
    humidity: locationData?.weatherData?.humidity || 0,
    cloudCover: locationData?.weatherData?.cloudCover || 0,
    windSpeed: locationData?.weatherData?.windSpeed || 0,
    precipitation: locationData?.weatherData?.precipitation || 0,
    time: locationData?.weatherData?.time || new Date().toISOString(),
    condition: locationData?.weatherData?.condition || 
      determineWeatherCondition(locationData?.weatherData?.cloudCover || 0)
  };

  const formatMoonPhase = (phase: number) => {
    if (typeof phase !== 'number') return "Unknown";
    
    if (phase <= 0.05 || phase >= 0.95) return "New Moon";
    if (phase < 0.25) return "Waxing Crescent";
    if (phase < 0.30) return "First Quarter";
    if (phase < 0.45) return "Waxing Gibbous";
    if (phase < 0.55) return "Full Moon";
    if (phase < 0.70) return "Waning Gibbous";
    if (phase < 0.80) return "Last Quarter";
    return "Waning Crescent";
  };

  const formatSeeingConditions = (value: number) => {
    if (typeof value !== 'number') return "Average";
    
    if (value <= 1) return "Excellent";
    if (value <= 2) return "Good";
    if (value <= 3) return "Average";
    if (value <= 4) return "Poor";
    return "Very Poor";
  };

  if (!locationData) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The location information you're looking for doesn't exist or has expired.
              Redirecting you to the home page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <LocationHeader 
          name={locationData.name}
          latitude={locationData.latitude}
          longitude={locationData.longitude}
          timestamp={locationData.timestamp}
          loading={loading}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <SIQSSummary
              siqs={siqsResult.score * 10}
              factors={siqsResult.factors}
              isViable={siqsResult.isViable}
            />
            
            <WeatherConditions
              weatherData={weatherData}
              moonPhase={formatMoonPhase(locationData.moonPhase || 0)}
              bortleScale={locationData.bortleScale || 4}
              seeingConditions={formatSeeingConditions(locationData.seeingConditions || 3)}
            />
          </div>
          
          <div className="space-y-8">
            <LocationMap
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              name={locationData.name || "Unnamed Location"}
              onLocationUpdate={handleLocationUpdate}
              editable={true}
            />
            
            <ForecastTable 
              forecastData={forecastData}
              isLoading={forecastLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationDetails;
