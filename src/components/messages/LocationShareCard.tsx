
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Navigation, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSIQSScore } from "@/utils/mapUtils";
import { useNavigate } from "react-router-dom";

interface LocationShareCardProps {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs?: number | { score: number; isViable?: boolean } | undefined;
  timestamp: string;
  isCertified?: boolean;
}

const LocationShareCard: React.FC<LocationShareCardProps> = ({
  id,
  name,
  latitude,
  longitude,
  siqs,
  timestamp,
  isCertified = false
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Format SIQS score for display
  const formattedSiqs = formatSIQSScore(siqs);
  
  const handleViewDetails = () => {
    navigate(`/location/${latitude.toFixed(6)},${longitude.toFixed(6)}`, {
      state: {
        id: id || `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
        name,
        latitude,
        longitude,
        siqs: typeof siqs === 'number' ? { score: siqs } : siqs,
        timestamp,
        fromMessage: true
      }
    });
  };

  return (
    <div className="bg-cosmic-900/70 backdrop-blur-md border border-cosmic-700/50 hover:border-cosmic-600/70 transition-colors duration-300 p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-50">{name}</h3>
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
          <span className="text-xs font-medium">{formattedSiqs}</span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-cosmic-400" />
          <span>{t("Latitude", "纬度")}: {latitude.toFixed(4)}, {t("Longitude", "经度")}: {longitude.toFixed(4)}</span>
        </div>
        
        <div className="flex items-center">
          <Navigation className="h-4 w-4 mr-2 text-cosmic-400" />
          <span>{t("Shared Location", "共享位置")}</span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDetails}
          className="flex items-center gap-1.5 text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("View Details", "查看详情")}
        </Button>
      </div>
    </div>
  );
};

export default LocationShareCard;
