
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/types/weather';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  onSelect?: (location: SharedAstroSpot) => void;
  className?: string;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  onSelect,
  className = ""
}) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  const formattedDistance = useMemo(() => {
    if (typeof location.distance !== 'number') return '';
    
    return location.distance < 1 
      ? `${Math.round(location.distance * 1000)}m` 
      : `${location.distance.toFixed(1)}km`;
  }, [location.distance]);
  
  // Get SIQS score as a number
  const siqsScore = useMemo(() => {
    return location.siqs?.score || 0;
  }, [location.siqs]);
  
  // Determine if location is viable for astrophotography
  const isViable = useMemo(() => {
    return location.siqs?.isViable || siqsScore > 4.0;
  }, [location.siqs, siqsScore]);
  
  // Get color class based on SIQS score
  const getScoreColorClass = useCallback((score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-lime-400';
    if (score >= 4) return 'text-yellow-400';
    if (score >= 2) return 'text-orange-400';
    return 'text-red-400';
  }, []);
  
  const scoreColorClass = useMemo(() => getScoreColorClass(siqsScore), [getScoreColorClass, siqsScore]);
  
  // Navigate to location details page
  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(location);
      return;
    }
    
    navigate(`/location/${location.id}`, {
      state: {
        id: location.id,
        name: location.name,
        latitude: location.latitude, 
        longitude: location.longitude,
        bortleScale: location.bortleScale,
        timestamp: location.timestamp || new Date().toISOString()
      }
    });
  }, [location, navigate, onSelect]);
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg border border-cosmic-800/50 
      hover:border-cosmic-700/80 bg-cosmic-900/60 backdrop-blur-sm ${className} 
      ${isViable ? 'animate-subtle-glow' : ''}`}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="flex justify-between items-center gap-2">
          <span className="truncate text-base">{location.name}</span>
          {location.distance !== undefined && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">{formattedDistance}</span>
          )}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="text-xs opacity-70">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pb-0">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">{t("Bortle Scale", "伯特尔等级")}</p>
            <p className="font-medium">{location.bortleScale}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("SIQS Score", "SIQS评分")}</p>
            <p className={`font-medium ${scoreColorClass}`}>{siqsScore.toFixed(1)}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-3">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full bg-cosmic-800/70 hover:bg-cosmic-700/80 border border-cosmic-700/40"
          onClick={handleSelect}
        >
          <Navigation className="h-3 w-3 mr-2" />
          {t("View Location", "查看位置")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PhotoLocationCard;
