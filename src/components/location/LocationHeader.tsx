
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Calendar, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4 hover:bg-cosmic-700/30 group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        {t("Back", "返回")}
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {name || t("Unnamed Location", "未命名位置")}
        </h1>
        
        <Button 
          onClick={() => navigate("/share", { state: { name, latitude, longitude, timestamp } })}
          disabled={loading}
          className="group bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all"
        >
          <Share2 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
          {t("Share This Location", "分享此位置")}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 bg-cosmic-800/40 backdrop-blur-sm rounded-lg p-3 border border-cosmic-700/30 shadow-inner">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5 text-primary/70" />
          <span className="mr-1 font-medium text-gray-300">{t("Latitude", "纬度")}:</span> {latitude.toFixed(4)}°
        </div>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5 text-primary/70" />
          <span className="mr-1 font-medium text-gray-300">{t("Longitude", "经度")}:</span> {longitude.toFixed(4)}°
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1.5 text-primary/70" />
          <span className="mr-1 font-medium text-gray-300">{t("Analysis Date", "分析日期")}:</span> {new Date(timestamp || Date.now()).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default LocationHeader;
