
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CloudCoverageMapProps {
  latitude: number;
  longitude: number;
}

// URL format for cloud coverage map
const getCloudMapUrl = (lat: number, lon: number, zoom: number, width: number, height: number) => {
  return `https://tile.openweathermap.org/map/clouds_new/${zoom}/${Math.floor((lon + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}?appid=d22d7834f3f98f471ef69f0273e7a9a6`;
};

const CloudCoverageMap: React.FC<CloudCoverageMapProps> = ({ latitude, longitude }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState("");
  const [errorLoading, setErrorLoading] = useState(false);
  
  useEffect(() => {
    if (!latitude || !longitude) {
      setIsLoading(false);
      setErrorLoading(true);
      return;
    }
    
    // Reset state when coordinates change
    setIsLoading(true);
    setErrorLoading(false);
    
    try {
      // Create the map URL
      const zoom = 5;
      const width = 650;
      const height = 450;
      const mapUrl = getCloudMapUrl(latitude, longitude, zoom, width, height);
      
      setImageSrc(mapUrl);
      
      // Create an Image object to check if loading is successful
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setErrorLoading(true);
      };
      img.src = mapUrl;
    } catch (error) {
      console.error("Error generating cloud map URL:", error);
      setIsLoading(false);
      setErrorLoading(true);
    }
  }, [latitude, longitude]);
  
  if (isLoading) {
    return (
      <div className="h-[220px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (errorLoading) {
    return (
      <div className="h-[220px] flex items-center justify-center text-center p-4">
        <p className="text-muted-foreground">
          {t("Cloud coverage map is currently unavailable.", "云层覆盖图当前不可用。")}
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden rounded-lg relative h-[220px] bg-cosmic-900/50">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${imageSrc})`,
          filter: "contrast(1.1) brightness(0.9)"
        }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-red-500 z-10 border-2 border-white shadow-lg" />
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 bg-cosmic-900/70 text-xs px-2 py-1 rounded text-center">
        {t("Current location cloud coverage", "当前位置云层覆盖")}
      </div>
    </div>
  );
};

export default CloudCoverageMap;
