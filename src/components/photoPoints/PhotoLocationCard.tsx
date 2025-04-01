
import React, { useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award, MapPin, ArrowRight, CloudSun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocationQuality from './LocationQuality';
import LocationWeatherBadge from './LocationWeatherBadge';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

export interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index,
  showRealTimeSiqs = false 
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | undefined>(location.siqs);
  
  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay: index * 0.05
      }
    },
    hover: { 
      y: -5,
      boxShadow: "0 10px 25px rgba(0, 0, 30, 0.2)",
      transition: { type: "spring", stiffness: 400 }
    }
  };
  
  const handleViewDetails = async () => {
    setIsLoading(true);
    
    try {
      // If real-time SIQS is requested and not already calculated, get it now
      let locationWithSiqs = location;
      
      if (showRealTimeSiqs && !location.siqs) {
        locationWithSiqs = await calculateRealTimeSiqs(location);
        setRealTimeSiqs(locationWithSiqs.siqs);
      }
      
      // Navigate to location details
      navigate(`/location/${encodeURIComponent(location.id)}`, {
        state: { 
          fromPhotoPoints: true,
          location: locationWithSiqs
        }
      });
    } catch (error) {
      console.error("Error navigating to location details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return "";
    
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${distance.toFixed(0)}km`;
    }
  };
  
  // Show certification badge
  const getCertificationBadge = () => {
    if (location.isDarkSkyReserve) {
      return (
        <div className="absolute top-3 right-3 bg-blue-600/80 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
          <Award className="h-3 w-3" />
          <span>{t("Dark Sky Reserve", "国际暗夜保护区")}</span>
        </div>
      );
    } else if (location.certification) {
      return (
        <div className="absolute top-3 right-3 bg-blue-600/80 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1">
          <Award className="h-3 w-3" />
          <span>{t("Certified", "认证暗夜地点")}</span>
        </div>
      );
    }
    return null;
  };

  // Format location details
  const getLocationDetails = () => {
    const details = [];
    
    if (location.county) details.push(location.county);
    if (location.state) details.push(location.state);
    if (location.country) details.push(location.country);
    
    if (details.length === 0) return null;
    
    return (
      <div className="flex items-center text-xs text-cosmic-300 mb-2">
        <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
        <span className="truncate">{details.join(', ')}</span>
      </div>
    );
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="relative bg-cosmic-900/80 border border-cosmic-700/50 rounded-xl overflow-hidden glassmorphism-dark"
    >
      {/* Certification badge */}
      {getCertificationBadge()}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gradient-blue">{location.name}</h3>
          {location.distance !== undefined && (
            <span className="text-xs text-cosmic-300 bg-cosmic-800/50 px-2 py-1 rounded flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {formatDistance(location.distance)}
            </span>
          )}
        </div>
        
        {/* Location details (county, state, country) */}
        {getLocationDetails()}
        
        {/* Location quality indicator */}
        <div className="mb-4">
          <LocationQuality 
            bortleScale={location.bortleScale || 5} 
            siqs={showRealTimeSiqs ? realTimeSiqs : location.siqs}
            weather={null}
            isChecking={false}
          />
        </div>
        
        {/* Weather badge - only show if SIQS is available */}
        {(showRealTimeSiqs || location.siqs !== undefined) && (
          <div className="mb-4">
            <LocationWeatherBadge 
              siqs={showRealTimeSiqs ? realTimeSiqs : location.siqs} 
              isViable={location.isViable !== false}
            />
          </div>
        )}
        
        {/* View details button */}
        <div className="flex justify-end mt-2">
          <Button 
            onClick={handleViewDetails} 
            disabled={isLoading}
            variant="outline" 
            size="sm"
            className="bg-cosmic-800/50 border-cosmic-700/30 hover:bg-cosmic-700/50"
          >
            {isLoading ? (
              <CloudSun className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {t("View Details", "查看详情")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;
