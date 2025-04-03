import React, { useState, useEffect } from 'react';
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

  // Get display name based on language and location type
  let displayName;
  
  // If it's a calculated location, use the "Potential ideal dark site" format
  if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
    displayName = language === 'en' 
      ? `Potential ideal dark site ${locationCounter}`
      : `潜在理想暗夜地点 ${locationCounter}`;
  } else {
    // Otherwise use the provided name
    displayName = language === 'en' ? location.name : (location.chineseName || location.name);
  }
  
  // Get SIQS score to display (real-time or stored)
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0);
  
  // If the SIQS score is 0 and we're not currently loading, don't render
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  const handleViewDetails = () => {
    // Prepare location data for details page
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
    
    // Save to localStorage to ensure proper refresh handling
    saveLocationFromPhotoPoints(locationData);
    
    // Navigate to location details with state
    navigate(`/location/${locationData.id}`, { state: { fromPhotoPoints: true, ...locationData } });
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
  
  return (
    <motion.div
      variants={cardVariants}
      className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
      layout={!isMobile}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
        
        {/* SIQS Score Badge */}
        <SiqsScoreBadge score={displaySiqs} loading={loadingSiqs} />
      </div>
      
      {/* Certification Badge */}
      <CertificationBadge 
        certification={location.certification} 
        isDarkSkyReserve={location.isDarkSkyReserve} 
      />
      
      {/* Light pollution indicator */}
      <div className="mb-4 mt-2">
        <LightPollutionIndicator 
          bortleScale={location.bortleScale || 5} 
          size="md"
          showBortleNumber={true}
          className="text-base"
        />
      </div>
      
      {/* Location metadata */}
      <LocationMetadata 
        distance={location.distance} 
        date={location.date} 
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
