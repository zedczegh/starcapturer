import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Clock, Loader2, Building2, Trees, Globe, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveLocationFromPhotoPoints } from '@/utils/locationStorage';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { getLocationNameForCoordinates } from '@/components/location/map/LocationNameService';
import { extractNearestTownName, getRegionalName } from '@/utils/locationNameFormatter';
import LightPollutionIndicator from '@/components/location/LightPollutionIndicator';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
  isMobile?: boolean;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index, 
  showRealTimeSiqs = false,
  isMobile = false 
}) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [locationCounter] = useState(() => {
    if (!location.id && !location.certification && !location.isDarkSkyReserve) {
      const storedCounter = parseInt(localStorage.getItem('potentialDarkSiteCounter') || '0');
      const newCounter = storedCounter + 1;
      localStorage.setItem('potentialDarkSiteCounter', newCounter.toString());
      return newCounter;
    }
    return null;
  });
  
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
  
  useEffect(() => {
    if (showRealTimeSiqs && location.latitude && location.longitude) {
      const fetchSiqs = async () => {
        setLoadingSiqs(true);
        try {
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            location.bortleScale || 5
          );
          
          if (result.siqs > 0) {
            setRealTimeSiqs(result.siqs);
          } else {
            setRealTimeSiqs(0);
          }
        } catch (error) {
          console.error("Error fetching real-time SIQS:", error);
        } finally {
          setLoadingSiqs(false);
        }
      };
      
      fetchSiqs();
    }
  }, [location, showRealTimeSiqs]);

  if (realTimeSiqs === 0) {
    return null;
  }

  let displayName;
  
  if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
    displayName = language === 'en' 
      ? `Potential ideal dark site ${locationCounter}`
      : `潜在理想暗夜地点 ${locationCounter}`;
  } else {
    displayName = language === 'en' ? location.name : (location.chineseName || location.name);
  }
  
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0);
  
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  const getCertificationInfo = () => {
    if (!location.certification && !location.isDarkSkyReserve) {
      return null;
    }
    
    const certification = (location.certification || '').toLowerCase();
    
    if (certification.includes('sanctuary') || certification.includes('reserve')) {
      return {
        icon: <Globe className="h-3.5 w-3.5 mr-1.5" />,
        text: t('Dark Sky Reserve', '暗夜保护区'),
        color: 'text-blue-400 border-blue-400/30 bg-blue-400/10'
      };
    } else if (certification.includes('park')) {
      return {
        icon: <Trees className="h-3.5 w-3.5 mr-1.5" />,
        text: t('Dark Sky Park', '暗夜公园'),
        color: 'text-green-400 border-green-400/30 bg-green-400/10'
      };
    } else if (certification.includes('community')) {
      return {
        icon: <Building2 className="h-3.5 w-3.5 mr-1.5" />,
        text: t('Dark Sky Community', '暗夜社区'),
        color: 'text-amber-400 border-amber-400/30 bg-amber-400/10'
      };
    } else if (certification.includes('urban')) {
      return {
        icon: <Building2 className="h-3.5 w-3.5 mr-1.5" />,
        text: t('Urban Night Sky', '城市夜空'),
        color: 'text-purple-400 border-purple-400/30 bg-purple-400/10'
      };
    } else {
      return {
        icon: <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />,
        text: t('Certified Location', '认证地点'),
        color: 'text-blue-300 border-blue-300/30 bg-blue-300/10'
      };
    }
  };
  
  const handleViewDetails = () => {
    const locationData = {
      id: location.id || `calc-loc-${Date.now()}`,
      name: displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: location.isDarkSkyReserve,
      certification: location.certification
    };
    
    saveLocationFromPhotoPoints(locationData);
    
    navigate(`/location/${locationData.id}`, { state: { fromPhotoPoints: true, ...locationData } });
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: isMobile ? 10 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: isMobile ? 0.2 : 0.4,
        delay: isMobile ? index * 0.05 : index * 0.1
      }
    }
  };

  const certInfo = getCertificationInfo();
  
  return (
    <motion.div
      variants={cardVariants}
      className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
      layout={!isMobile}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
        
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-500/40">
          {loadingSiqs ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5 mr-1.5 text-yellow-400" fill="#facc15" />
          )}
          <span className="text-sm font-medium">
            {loadingSiqs ? '...' : formatSIQSScoreForDisplay(displaySiqs)}
          </span>
        </div>
      </div>
      
      {certInfo && (
        <div className="mb-3 mt-1.5">
          <Badge variant="outline" className={`${certInfo.color} px-2.5 py-1.5 rounded-full flex items-center`}>
            {certInfo.icon}
            <span className="text-sm">{certInfo.text}</span>
          </Badge>
        </div>
      )}
      
      <div className="mb-4 mt-2">
        <LightPollutionIndicator 
          bortleScale={location.bortleScale || 5} 
          size="md"
          showBortleNumber={true}
          className="text-base"
        />
      </div>
      
      <div className="flex flex-col space-y-2.5 mt-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">{formatDistance(location.distance)}</span>
        </div>
        
        {location.date && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium">{formatDate(location.date)}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 sci-fi-btn transition-all duration-300 text-sm"
        >
          {t("View Details", "查看详情")}
        </Button>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;
