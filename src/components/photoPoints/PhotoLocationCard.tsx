
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveLocationFromPhotoPoints } from '@/utils/locationStorage';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import LightPollutionIndicator from '@/components/location/LightPollutionIndicator';
import SiqsScoreBadge from './cards/SiqsScoreBadge';
import CertificationBadge from './cards/CertificationBadge';
import LocationMetadata from './cards/LocationMetadata';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { MapPin } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  
  const [locationCounter] = useState(() => {
    if (!location.id && !location.certification && !location.isDarkSkyReserve) {
      const storedCounter = parseInt(localStorage.getItem('potentialDarkSiteCounter') || '0');
      const newCounter = storedCounter + 1;
      localStorage.setItem('potentialDarkSiteCounter', newCounter.toString());
      return newCounter;
    }
    return null;
  });
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && location.latitude && location.longitude) {
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
  }, [location, showRealTimeSiqs, isVisible]);

  if (realTimeSiqs === 0) {
    return null;
  }

  // Get nearest town information with enhanced details
  const nearestTownInfo = location.latitude && location.longitude ? 
    findNearestTown(location.latitude, location.longitude, language) : null;
  
  // Use detailed location name as the display name based on language
  let displayName;
  
  if (nearestTownInfo && nearestTownInfo.detailedName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
    // Use detailed name from our enhanced database
    displayName = nearestTownInfo.detailedName;
  } else if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
    // Fallback for potential ideal dark sites
    displayName = language === 'en' 
      ? `Potential ideal dark site ${locationCounter}`
      : `潜在理想暗夜地点 ${locationCounter}`;
  } else {
    // Fallback to original name based on language
    displayName = language === 'zh' 
      ? (location.chineseName || location.name) 
      : location.name;
  }
  
  // Check if we need to show original name
  const showOriginalName = nearestTownInfo && 
    nearestTownInfo.townName !== (language === 'en' ? 'Remote area' : '偏远地区') && 
    (language === 'zh'
      ? (location.chineseName && !location.chineseName.includes(nearestTownInfo.townName))
      : (location.name && !location.name.includes(nearestTownInfo.townName)));
  
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0);
  
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  const handleViewDetails = () => {
    const locationData = {
      id: location.id || `calc-loc-${Date.now()}`,
      name: location.name,
      chineseName: location.chineseName,
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
        delay: isMobile ? Math.min(index * 0.05, 0.3) : Math.min(index * 0.1, 0.5)
      }
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
      layout={!isMobile}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
        
        <SiqsScoreBadge score={displaySiqs} loading={loadingSiqs} />
      </div>
      
      <CertificationBadge 
        certification={location.certification} 
        isDarkSkyReserve={location.isDarkSkyReserve} 
      />
      
      {/* Show original location name if different from nearest town name */}
      {showOriginalName && (
        <div className="mt-1.5 mb-2 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {language === 'en' ? location.name : (location.chineseName || location.name)}
          </span>
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
      
      <LocationMetadata 
        distance={location.distance} 
        date={location.date}
        latitude={location.latitude}
        longitude={location.longitude}
        locationName={displayName}
      />
      
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
