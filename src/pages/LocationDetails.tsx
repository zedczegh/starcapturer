
import React, { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, Share2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import LocationMap from "@/components/LocationMap";
import { toast } from "@/components/ui/use-toast";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationData = location.state;

  useEffect(() => {
    // If there's no location data and we're not coming from another page,
    // redirect to the home page after showing a toast
    if (!locationData) {
      toast({
        title: "Location Not Found",
        description: "The requested location information is not available or has expired.",
        variant: "destructive",
      });
      
      // Use a small timeout to ensure the toast appears before redirecting
      const redirectTimer = setTimeout(() => {
        navigate("/");
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [locationData, navigate]);

  // If there's no state data, render a loading state while we're redirecting
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

  // Create default values to prevent runtime errors
  const siqsResult = locationData.siqsResult || { 
    siqs: 0, 
    factors: [], 
    isViable: false 
  };
  
  // Determine weather condition based on cloud cover if not provided
  const determineWeatherCondition = (cloudCover: number) => {
    if (cloudCover < 10) return "clear";
    if (cloudCover < 30) return "partly cloudy";
    if (cloudCover < 70) return "cloudy";
    return "overcast";
  };
  
  // Ensure weatherData always has all required properties to prevent errors
  const weatherData = {
    temperature: locationData.weatherData?.temperature || 0, 
    humidity: locationData.weatherData?.humidity || 0, 
    cloudCover: locationData.weatherData?.cloudCover || 0, 
    windSpeed: locationData.weatherData?.windSpeed || 0, 
    precipitation: locationData.weatherData?.precipitation || 0,
    time: locationData.weatherData?.time || new Date().toISOString(),
    // Determine condition based on cloud cover if not provided
    condition: locationData.weatherData?.condition || 
      determineWeatherCondition(locationData.weatherData?.cloudCover || 0)
  };

  // Format moon phase for display
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

  // Format seeing conditions for display
  const formatSeeingConditions = (value: number) => {
    if (typeof value !== 'number') return "Average";
    
    if (value <= 1) return "Excellent";
    if (value <= 2) return "Good";
    if (value <= 3) return "Average";
    if (value <= 4) return "Poor";
    return "Very Poor";
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">{locationData.name || "Unnamed Location"}</h1>
            
            <div className="flex space-x-3">
              <Button variant="outline">
                <Map className="mr-2 h-4 w-4" />
                View on OSM
              </Button>
              
              <Button onClick={() => navigate("/share", { state: locationData })}>
                <Share2 className="mr-2 h-4 w-4" />
                Share This Location
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            <div>
              Latitude: {locationData.latitude}
            </div>
            <div>•</div>
            <div>
              Longitude: {locationData.longitude}
            </div>
            <div>•</div>
            <div>
              Analysis Date: {new Date(locationData.timestamp || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <SIQSSummary
              siqs={siqsResult.siqs}
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
          
          <div>
            <LocationMap
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              name={locationData.name || "Unnamed Location"}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationDetails;
