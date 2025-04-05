
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Globe, Loader2 } from "lucide-react";

interface MapViewProps {
  latitude: number;
  longitude: number;
  name: string;
  bortleScale?: number;
}

const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  name,
  bortleScale
}) => {
  const [mapUrl, setMapUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Create OpenStreetMap URL
    const zoom = 12;
    const color = bortleScale ? getBortleColor(bortleScale) : "blue";
    
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${
      longitude - 0.1},${latitude - 0.1},${longitude + 0.1},${latitude + 0.1}&layer=mapnik&marker=${
      latitude},${longitude}&show_location_dialog=false`;
    
    setMapUrl(url);
    
    // Set loading false after a delay to ensure the iframe has time to load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [latitude, longitude, bortleScale]);
  
  return (
    <Card className="w-full h-[300px] relative overflow-hidden border-cosmic-700/30">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-cosmic-900/70 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {!mapUrl ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cosmic-900/50">
          <Globe className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Map cannot be displayed</p>
        </div>
      ) : (
        <iframe
          title={`Map view of ${name}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          style={{ border: 0 }}
          className="absolute inset-0"
          onLoad={() => setLoading(false)}
        />
      )}
    </Card>
  );
};

// Helper function to get color based on Bortle scale
function getBortleColor(bortleScale: number): string {
  if (bortleScale <= 2) return "green";
  if (bortleScale <= 4) return "blue";
  if (bortleScale <= 6) return "orange";
  return "red";
}

export default MapView;
