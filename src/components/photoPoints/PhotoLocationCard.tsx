
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight, Eye, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSafeScore, formatSIQSScore } from '@/utils/geoUtils';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  onSelect?: (location: SharedAstroSpot) => void;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index, 
  onSelect 
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const displayName = language === 'en' ? location.name : (location.chineseName || location.name);
  
  // Get score from potentially complex SIQS data
  const score = getSafeScore(location.siqs);
  
  // Format distance for display
  const formatDistance = () => {
    if (location.distance === undefined) return '';
    
    if (location.distance < 1) 
      return t(`${Math.round(location.distance * 1000)} m away`, `距离 ${Math.round(location.distance * 1000)} 米`);
    if (location.distance < 100) 
      return t(`${Math.round(location.distance)} km away`, `距离 ${Math.round(location.distance)} 公里`);
    return t(`${Math.round(location.distance / 100) * 100} km away`, `距离 ${Math.round(location.distance / 100) * 100} 公里`);
  };
  
  // Format certification type into a friendly display name
  const formatCertification = (certification?: string) => {
    if (!certification) return '';
    
    // Extract the last part of certification name for display
    const parts = certification.split(' ');
    if (parts.length > 2) {
      // Try to get meaningful parts like "Dark Sky Park"
      if (parts.includes('Dark') && parts.includes('Sky')) {
        const darkIndex = parts.indexOf('Dark');
        if (darkIndex >= 0 && parts[darkIndex+1] === 'Sky' && parts.length > darkIndex+2) {
          return parts[darkIndex+2]; // Return "Park", "Reserve", etc.
        }
      }
    }
    
    // Fallback to showing the last part only
    return parts[parts.length - 1];
  };
  
  // Determine SIQS color class
  const getSiqsColorClass = () => {
    if (score > 8) return 'text-green-400 bg-green-900/30';
    if (score > 6) return 'text-purple-400 bg-purple-900/30';
    if (score > 4) return 'text-yellow-400 bg-yellow-900/30';
    if (score > 2) return 'text-orange-400 bg-orange-900/30';
    return 'text-red-400 bg-red-900/30';
  };
  
  const handleViewDetails = () => {
    navigate(`/location/${location.id}`, {
      state: {
        ...location,
        fromPhotoPoints: true // Add flag to indicate we're coming from PhotoPoints
      }
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="glassmorphism h-full flex flex-col overflow-hidden border-cosmic-700/30 hover:shadow-glow transition-all duration-300">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 mr-2">
              <h3 className="font-semibold text-lg text-white line-clamp-1">{displayName}</h3>
              
              {/* Dark Sky certification badge with enhanced styling */}
              {(location.isDarkSkyReserve || location.certification) && (
                <div className="flex items-center gap-1 mt-1">
                  <Award 
                    className="h-3.5 w-3.5 text-blue-400" 
                    fill="rgba(96, 165, 250, 0.3)" 
                  />
                  <span className="text-xs text-blue-400 flex items-center">
                    {t("Dark Sky", "暗夜")}
                    {location.certification && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-900/30 rounded-full text-[10px] font-medium text-blue-300">
                        {language === 'en' 
                          ? formatCertification(location.certification) 
                          : t(formatCertification(location.certification), "认证")}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            <motion.div 
              className={`px-2.5 py-1 rounded-full text-sm font-medium ${getSiqsColorClass()} flex items-center shadow-glow-light`}
              whileHover={{ scale: 1.1 }}
              animate={{ 
                scale: score > 7 ? [1, 1.05, 1] : 1,
                opacity: score > 7 ? [1, 0.8, 1] : 1
              }}
              transition={score > 7 ? { 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse" 
              } : {}}
            >
              <Star className="h-3.5 w-3.5 mr-1" fill="currentColor" />
              {formatSIQSScore(location.siqs)}
            </motion.div>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1.5" />
            <span className="text-sm">
              {formatDistance()}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
            <div>
              <span className="block text-muted-foreground">{t("Bortle Scale", "波尔特尔亮度等级")}</span>
              <span className="text-white">{location.bortleScale}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">{t("Coordinates", "坐标")}</span>
              <span className="text-white text-xs truncate">
                {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
              </span>
            </div>
          </div>
          
          {/* Show full certification if available */}
          {location.certification && (
            <div className="mt-2 text-xs">
              <span className="block text-blue-400">{t("Certification", "认证")}</span>
              <span className="text-blue-200 line-clamp-1">{location.certification}</span>
            </div>
          )}
          
          {/* Show photographer if available */}
          {location.photographer && (
            <div className="mt-2 text-xs">
              <span className="block text-muted-foreground">{t("Photographer", "摄影师")}</span>
              <span className="text-white">{location.photographer}</span>
            </div>
          )}
        </div>
        
        <div className="border-t border-cosmic-700/30 p-3 flex justify-between items-center bg-cosmic-900/40">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-focus hover:bg-cosmic-800/70 hover:opacity-90 transition-all duration-300"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {t("View Details", "查看详情")}
          </Button>
          
          {onSelect && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-focus hover:bg-cosmic-800/70 hover:opacity-90 transition-all duration-300"
              onClick={() => onSelect(location)}
            >
              {t("Select", "选择")}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default PhotoLocationCard;
