
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
  const [nearestTown, setNearestTown] = useState<string | null>(null);
  const [loadingTown, setLoadingTown] = useState(false);
  const [locationCounter] = useState(() => {
    // Generate a counter for potential locations if this is a calculated location
    if (!location.id && !location.certification && !location.isDarkSkyReserve) {
      // Get or set a counter for potential dark sites
      const storedCounter = parseInt(localStorage.getItem('potentialDarkSiteCounter') || '0');
      const newCounter = storedCounter + 1;
      localStorage.setItem('potentialDarkSiteCounter', newCounter.toString());
      return newCounter;
    }
    return null;
  });
  
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
  
  // Get nearest town name
  useEffect(() => {
    if (location.latitude && location.longitude) {
      const fetchNearestTown = async () => {
        setLoadingTown(true);
        try {
          // First check if location already has a name we can use
          if (location.name && 
              !location.name.includes("°") && 
              !location.name.includes("Location at") &&
              !location.name.includes("位置在") &&
              !location.name.includes("Remote area") &&
              !location.name.includes("偏远地区")) {
            
            const extractedName = extractNearestTownName(location.name, location.description, language);
            setNearestTown(extractedName);
            setLoadingTown(false);
            return;
          }
          
          // Try directional region naming first (e.g., "Northwest Yunnan")
          const regionalName = getRegionalName(location.latitude, location.longitude, language);
          
          // If we got a valid region name, use it
          if (regionalName && regionalName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
            setNearestTown(regionalName);
            setLoadingTown(false);
            return;
          }
          
          // Otherwise fetch from our location service
          const townName = await getLocationNameForCoordinates(
            location.latitude,
            location.longitude,
            language
          );
          
          if (townName) {
            const extractedTownName = extractNearestTownName(townName, location.description, language);
            setNearestTown(extractedTownName);
          } else {
            setNearestTown(language === 'en' ? 'Remote area' : '偏远地区');
          }
        } catch (error) {
          console.error("Error fetching nearest town:", error);
          setNearestTown(language === 'en' ? 'Remote area' : '偏远地区');
        } finally {
          setLoadingTown(false);
        }
      };
      
      fetchNearestTown();
    }
  }, [location, language]);
  
  // Load real-time SIQS data if requested
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
          
          // Only update if SIQS is greater than 0
          if (result.siqs > 0) {
            setRealTimeSiqs(result.siqs);
          } else {
            // If we got a zero score, hide this card
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

  // If we have a real-time SIQS of 0, don't render this card
  if (realTimeSiqs === 0) {
    return null;
  }

  // Get display name based on language
  let displayName = language === 'en' ? location.name : (location.chineseName || location.name);
  
  // Simplify name for calculated locations
  if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
    displayName = language === 'en' 
      ? `Potential ideal dark site ${locationCounter}`
      : `潜在理想暗夜地点 ${locationCounter}`;
  }
  
  // Get SIQS score to display (real-time or stored)
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0);
  
  // If the SIQS score is 0 and we're not currently loading, don't render
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  // Determine certification icon and details
  const getCertificationInfo = () => {
    if (!location.certification && !location.isDarkSkyReserve) {
      return null;
    }
    
    const certification = (location.certification || '').toLowerCase();
    
    if (certification.includes('sanctuary') || certification.includes('reserve')) {
      return {
        icon: <Globe className="h-3 w-3 mr-1" />,
        text: t('Dark Sky Reserve', '暗夜保护区'),
        color: 'text-blue-400'
      };
    } else if (certification.includes('park')) {
      return {
        icon: <Trees className="h-3 w-3 mr-1" />,
        text: t('Dark Sky Park', '暗夜公园'),
        color: 'text-green-400'
      };
    } else if (certification.includes('community')) {
      return {
        icon: <Building2 className="h-3 w-3 mr-1" />,
        text: t('Dark Sky Community', '暗夜社区'),
        color: 'text-amber-400'
      };
    } else if (certification.includes('urban')) {
      return {
        icon: <Building2 className="h-3 w-3 mr-1" />,
        text: t('Urban Night Sky', '城市夜空'),
        color: 'text-purple-400'
      };
    } else {
      return {
        icon: <ShieldCheck className="h-3 w-3 mr-1" />,
        text: t('Certified Location', '认证地点'),
        color: 'text-blue-300'
      };
    }
  };
  
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
  
  // Animation variants - reduced for mobile
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
        <h3 className="text-lg font-medium line-clamp-1">{displayName}</h3>
        
        <div className="flex items-center">
          {certInfo ? (
            <Badge variant="secondary" className="mr-2 bg-blue-500/20 text-blue-300 border-blue-500/40">
              {certInfo.icon}
              <span className="text-xs">{certInfo.text}</span>
            </Badge>
          ) : null}
          
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
      
      {/* Light pollution indicator */}
      <div className="mb-3">
        <LightPollutionIndicator 
          bortleScale={location.bortleScale || 5} 
          siqs={displaySiqs}
          size="sm" 
          compact={true} 
        />
      </div>
      
      <div className="flex flex-col space-y-1.5 mt-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1.5" />
          {formatDistance(location.distance)}
        </div>
        
        {/* Nearest town information */}
        <div className="flex items-center text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 mr-1.5" />
          {loadingTown ? (
            <span className="flex items-center">
              <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
              {t("Loading...", "加载中...")}
            </span>
          ) : nearestTown ? (
            <span className="line-clamp-1">{t("Near ", "靠近 ")}{nearestTown}</span>
          ) : (
            <span>{t("Remote location", "偏远位置")}</span>
          )}
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
          className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 sci-fi-btn transition-all duration-300 text-xs"
        >
          {t("View Details", "查看详情")}
        </Button>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;
