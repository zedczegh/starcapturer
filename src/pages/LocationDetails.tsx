
import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, Share2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import SIQSSummary from "@/components/SIQSSummary";
import WeatherConditions from "@/components/WeatherConditions";
import LocationMap from "@/components/LocationMap";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationData = location.state;

  // If there's no state data, we need to handle that
  if (!locationData) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The location information you're looking for doesn't exist or has expired.
            </p>
            <Button onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">{locationData.name}</h1>
            
            <div className="flex space-x-3">
              <Button variant="outline" asChild>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Map className="mr-2 h-4 w-4" />
                  View on Map
                </a>
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
              Analysis Date: {new Date(locationData.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <SIQSSummary
              siqs={locationData.siqsResult.siqs}
              factors={locationData.siqsResult.factors}
              isViable={locationData.siqsResult.isViable}
            />
            
            <WeatherConditions
              weatherData={locationData.weatherData}
              moonPhase={locationData.moonPhase}
              bortleScale={locationData.bortleScale}
              seeingConditions={locationData.seeingConditions}
            />
          </div>
          
          <div>
            <LocationMap
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              name={locationData.name}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationDetails;
