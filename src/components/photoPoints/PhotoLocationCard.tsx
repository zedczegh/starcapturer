
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Info, Star, Award, Thermometer, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatSIQSScore } from '@/utils/geoUtils';
import { saveLocationFromPhotoPoints } from '@/utils/locationStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index,
  showRealTimeSiqs = false
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isUpdatingSiqs, setIsUpdatingSiqs] = useState(false);
  const [localSiqs, setLocalSiqs] = useState<number | undefined>(location.siqs);
  
  // Display names in proper language
  const locationName = language === 'en' 
    ? location.name 
    : (location.chineseName || location.name);
  
  // Format distance string
  const formatDistance = (distance?: number) => {
    if (!distance) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m`, `${Math.round(distance * 1000)} 米`);
    if (distance < 10) 
      return t(`${distance.toFixed(1)} km`, `${distance.toFixed(1)} 公里`);
    return t(`${Math.round(distance)} km`, `${Math.round(distance)} 公里`);
  };
  
  // Update SIQS in real-time if needed
  useEffect(() => {
    let isMounted = true;
    
    if (showRealTimeSiqs && !location.siqs && !isUpdatingSiqs) {
      setIsUpdatingSiqs(true);
      
      calculateRealTimeSiqs(location.latitude, location.longitude, location.bortleScale)
        .then(result => {
          if (isMounted) {
            setLocalSiqs(result.siqs);
            setIsUpdatingSiqs(false);
          }
        })
        .catch(err => {
          console.error("Error calculating real-time SIQS:", err);
          setIsUpdatingSiqs(false);
        });
    }
    
    return () => {
      isMounted = false;
    };
  }, [location, showRealTimeSiqs, isUpdatingSiqs]);
  
  const handleViewDetails = () => {
    const locationData = {
      id: location.id,
      name: locationName,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale,
      siqs: localSiqs || location.siqs,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: location.isDarkSkyReserve,
      certification: location.certification,
      county: location.county,
      state: location.state,
      country: location.country
    };
    
    saveLocationFromPhotoPoints(locationData);
    
    navigate(`/location/${location.id}`, { state: locationData });
  };
  
  // Transition delay for staggered animation
  const delay = index * 0.1;
  
  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay,
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };
  
  // Get SIQS color based on value
  const getSiqsColor = (siqs?: number) => {
    if (!siqs) return "text-muted-foreground";
    if (siqs >= 7) return "text-green-400";
    if (siqs >= 5) return "text-yellow-400";
    return "text-red-400";
  };
  
  // Certification badge based on location type
  const CertificationBadge = () => {
    if (!location.isDarkSkyReserve && !location.certification) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-2 right-2 bg-blue-900/70 p-1 rounded-full">
              <Award className="h-4 w-4 text-blue-400" fill="rgba(96, 165, 250, 0.2)" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {location.certification || t("Dark Sky Location", "暗夜天空地点")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative h-full"
    >
      <Card className="h-full overflow-hidden bg-cosmic-800/50 border border-cosmic-700/50 hover:border-cosmic-600/60 transition-all duration-300">
        <CardContent className="p-0">
          <div className="p-4 pb-1">
            <h3 className="font-medium text-sm mb-1 line-clamp-1">{locationName}</h3>
            
            <div className="flex items-center text-xs text-muted-foreground mb-3 line-clamp-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>
                {location.county && location.state ? 
                  `${location.county}, ${location.state}, ${location.country || ''}` : 
                  formatDistance(location.distance)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center">
                <Star className={`h-3.5 w-3.5 mr-1 ${getSiqsColor(localSiqs || location.siqs)}`} 
                     fill={localSiqs || location.siqs ? "#facc15" : "none"} />
                <span className={`text-xs font-medium ${getSiqsColor(localSiqs || location.siqs)}`}>
                  {isUpdatingSiqs ? 
                    t("Calculating...", "计算中...") : 
                    `SIQS: ${formatSIQSScore(localSiqs || location.siqs)}`}
                </span>
              </div>
              
              <div className="flex items-center justify-end">
                <Cloud className="h-3.5 w-3.5 mr-1 text-blue-400" />
                <span className="text-xs">
                  {t(`Bortle: ${location.bortleScale || '?'}`, `波特尔: ${location.bortleScale || '?'}`)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-3 pt-1 flex items-center justify-between bg-cosmic-800/40">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{formatDistance(location.distance)}</span>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost"
              className="h-7 text-xs px-2 text-primary hover:text-primary-focus hover:bg-cosmic-700/50"
              onClick={handleViewDetails}
            >
              {t("View Details", "查看详情")}
            </Button>
          </div>
        </CardContent>
        
        <CertificationBadge />
      </Card>
    </motion.div>
  );
};

export default PhotoLocationCard;
