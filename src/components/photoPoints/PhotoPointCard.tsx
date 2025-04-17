
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { MapPin, Calendar, Award, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from './cards/SiqsScoreBadge';

interface PhotoPointCardProps {
  location: SharedAstroSpot;
  onViewDetails: (location: SharedAstroSpot) => void;
  userLocation: { latitude: number; longitude: number } | null;
  compact?: boolean;
  className?: string;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({ 
  location, 
  onViewDetails,
  userLocation,
  compact = false,
  className = ""
}) => {
  const { t, language } = useLanguage();
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Format distance to show km or miles based on language preference
  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    
    if (language === 'zh') {
      return `${distance.toFixed(1)} 公里`;
    } else {
      const miles = distance * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
  };
  
  // Get distance display text
  const distanceText = location.distance ? formatDistance(location.distance) : '';
  
  // Determine card size class based on compact mode
  const cardSizeClass = compact ? 'h-64' : 'h-[340px]';
  
  // Get card content class based on compact mode
  const contentClass = compact ? "p-3" : "p-4";
  
  // Determine if location is certified
  const isCertified = Boolean(location.certification || location.isDarkSkyReserve);
  
  return (
    <Card 
      className={`overflow-hidden transition-all hover:shadow-lg relative ${cardSizeClass} ${className}`}
      onClick={() => onViewDetails(location)}
    >
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        <SiqsScoreBadge score={location.siqs} isCertified={isCertified} />
        
        {isCertified && (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white flex gap-1 items-center">
            <Award className="h-3 w-3" /> 
            {t("Certified", "认证地点")}
          </Badge>
        )}
      </div>
      
      <div className="relative h-1/2 overflow-hidden bg-muted">
        {!imageError && location.image ? (
          <img 
            src={location.image} 
            alt={location.name || "Location"} 
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
            <MapPin className="h-12 w-12 text-slate-500" />
          </div>
        )}
      </div>
      
      <CardContent className={`${contentClass}`}>
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {location.name || t("Unnamed Location", "未命名位置")}
        </h3>
        
        {!compact && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {location.description || t("No description available", "暂无描述")}
          </p>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {distanceText}
          </span>
        </div>
        
        {location.lastVisit && !compact && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(location.lastVisit).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className={`${compact ? "p-3 pt-0" : "p-4 pt-0"}`}>
        <Button 
          variant="secondary" 
          size={compact ? "sm" : "default"} 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(location);
          }}
        >
          {t("View Details", "查看详情")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PhotoPointCard;
