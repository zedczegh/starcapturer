
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Clock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveLocationFromPhotoPoints } from '@/utils/locationStorage';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';
import { refreshSiqsData } from '@/services/realTimeSiqsService';

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
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  
  // Format the distance for display
  const formatDistance = (distance?: number) => {
    if (!distance) return t("Unknown distance", "未知距离");
    
    if (distance < 1) {
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    }
    
    if (distance < 10) {
      return t(`${distance.toFixed(1)} km away`, `距离 ${distance.toFixed(1)} 公里`);
    }
    
    return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
  };
  
  // Format the date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return '';
    }
  };
  
  // Load real-time SIQS data if requested
  useEffect(() => {
    if (showRealTimeSiqs && location.latitude && location.longitude) {
      const fetchSiqs = async () => {
        setLoadingSiqs(true);
        try {
          const result = await refreshSiqsData(
            location.latitude,
            location.longitude,
            location.bortleScale || 5
          );
          
          setRealTimeSiqs(result.siqs);
        } catch (error) {
          console.error("Error fetching real-time SIQS:", error);
        } finally {
          setLoadingSiqs(false);
        }
      };
      
      fetchSiqs();
    }
  }, [location, showRealTimeSiqs]);

  // Get display name based on language
  const displayName = language === 'en' ? location.name : (location.chineseName || location.name);
  
  // Get SIQS score to display (real-time or stored)
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0);
  
  const handleViewDetails = () => {
    // Prepare location data for details page
    const locationData = {
      id: location.id,
      name: displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: location.isDarkSkyReserve,
      certification: location.certification
    };
    
    // Save to localStorage to ensure proper refresh handling
    saveLocationFromPhotoPoints(locationData);
    
    // Navigate to location details with state
    navigate(`/location/${location.id}`, { state: { fromPhotoPoints: true, ...locationData } });
  };
  
  // Animation variants
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
      scale: 1.02,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-cosmic-800/30 backdrop-blur-md p-4 rounded-lg border border-cosmic-600/30 shadow-lg overflow-hidden"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium line-clamp-1 text-gradient">{displayName}</h3>
        
        <div className="flex items-center">
          {(location.isDarkSkyReserve || location.certification) && (
            <Badge variant="secondary" className="mr-2 bg-blue-500/20 text-blue-300 border-blue-500/40">
              <Award className="h-3 w-3 mr-1" />
              {t("Certified", "认证")}
            </Badge>
          )}
          
          <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
            {loadingSiqs ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Star className="h-3 w-3 mr-1 text-yellow-400" fill="#facc15" />
            )}
            <span className="text-xs font-medium">
              {loadingSiqs ? '...' : formatSIQSScoreForDisplay(displaySiqs)}
            </span>
          </div>
        </div>
      </div>
      
      {location.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{location.description}</p>
      )}
      
      <div className="flex flex-col space-y-1.5 mt-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1.5" />
          {formatDistance(location.distance)}
        </div>
        
        {location.date && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1.5" />
            {formatDate(location.date)}
          </div>
        )}
      </div>
      
      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 transition-all duration-300 text-xs flex items-center gap-1"
        >
          {t("View Details", "查看详情")}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;
