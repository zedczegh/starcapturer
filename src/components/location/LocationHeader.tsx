
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, Share2 } from "lucide-react";

interface LocationHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: number;
  loading?: boolean;
}

const LocationHeader = ({ 
  name, 
  latitude, 
  longitude, 
  timestamp, 
  loading 
}: LocationHeaderProps) => {
  const navigate = useNavigate();

  return (
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
        <h1 className="text-3xl font-bold">{name || "Unnamed Location"}</h1>
        
        <div className="flex space-x-3">
          <Button variant="outline">
            <Map className="mr-2 h-4 w-4" />
            View on OSM
          </Button>
          
          <Button 
            onClick={() => navigate("/share", { state: { name, latitude, longitude, timestamp } })}
            disabled={loading}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share This Location
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
        <div>
          Latitude: {latitude}
        </div>
        <div>•</div>
        <div>
          Longitude: {longitude}
        </div>
        <div>•</div>
        <div>
          Analysis Date: {new Date(timestamp || Date.now()).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default LocationHeader;
