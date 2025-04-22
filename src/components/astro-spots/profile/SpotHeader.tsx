
import React from 'react';
import { Star, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SpotHeaderProps {
  spot: {
    name: string;
    latitude: number;
    longitude: number;
    created_at: string;
    siqs?: number;
  };
  onViewDetails: () => void;
}

const SpotHeader: React.FC<SpotHeaderProps> = ({ spot, onViewDetails }) => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-gradient-to-r from-cosmic-800/80 to-cosmic-800/40 p-6 border-b border-cosmic-700/30">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-50 flex items-center">
            <Star className="h-5 w-5 text-yellow-400 mr-2 animate-pulse" />
            {spot.name}
          </h1>
          <div className="flex items-center text-gray-400 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
          </div>
          <div className="flex items-center text-gray-400 text-sm mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(spot.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <Button 
          variant="default" 
          onClick={onViewDetails}
          className="bg-primary/80 hover:bg-primary flex items-center gap-2 rounded-full"
        >
          <ExternalLink className="h-4 w-4" />
          {t("View Location Details", "查看位置详情")}
        </Button>
      </div>
      
      {spot.siqs && (
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-cosmic-700/60 text-primary-foreground">
          <span className="font-bold mr-1">{t("SIQS", "SIQS")}:</span>
          <span 
            className={`px-2 py-0.5 rounded-full font-mono text-sm ${
              spot.siqs >= 8 ? 'bg-green-500/80 text-white' :
              spot.siqs >= 6 ? 'bg-blue-500/80 text-white' :
              spot.siqs >= 4 ? 'bg-yellow-500/80 text-white' :
              'bg-red-500/80 text-white'
            }`}
          >
            {spot.siqs}
          </span>
        </div>
      )}
    </div>
  );
};

export default SpotHeader;
