
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveLocationFromPhotoPoints } from '@/utils/locationStorage';
import LightPollutionIndicator from '@/components/location/LightPollutionIndicator';
import SiqsScoreBadge from './cards/SiqsScoreBadge';
import CertificationBadge from './cards/CertificationBadge';
import LocationMetadata from './cards/LocationMetadata';
import VisibilityObserver from './cards/VisibilityObserver';
import RealTimeSiqsFetcher from './cards/RealTimeSiqsFetcher';
import LocationHeader from './cards/LocationHeader';
import { useDisplayName } from './cards/DisplayNameResolver';

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
  
  const [locationCounter] = useState(() => {
    if (!location.id && !location.certification && !location.isDarkSkyReserve) {
      const storedCounter = parseInt(localStorage.getItem('potentialDarkSiteCounter') || '0');
      const newCounter = storedCounter + 1;
      localStorage.setItem('potentialDarkSiteCounter', newCounter.toString());
      return newCounter;
    }
    return null;
  });
  
  // Use the extracted display name logic
  const { displayName, showOriginalName } = useDisplayName({
    location,
    language,
    locationCounter
  });
  
  // Handle SIQS calculation results
  const handleSiqsCalculated = (siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setLoadingSiqs(loading);
  };
  
  if (realTimeSiqs === 0) {
    return null;
  }
  
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0);
  
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  const handleViewDetails = () => {
    // Generate a consistent ID for the location
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    // Create a robust location data object with all necessary fields
    const locationData = {
      id: locationId,
      name: location.name || 'Unnamed Location',
      chineseName: location.chineseName || '',
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || 4,
      siqs: realTimeSiqs !== null ? realTimeSiqs : location.siqs,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: !!location.isDarkSkyReserve,
      certification: location.certification || '',
      // Include all potential fields that might be needed
      siqsResult: (realTimeSiqs !== null || location.siqs) ? { 
        score: realTimeSiqs !== null ? realTimeSiqs : (location.siqs || 0) 
      } : undefined
    };
    
    // Save location data to localStorage for better state persistence
    saveLocationFromPhotoPoints(locationData);
    
    // Use the consistent ID in the URL
    console.log(`Navigating to location details: ${locationId}`, locationData);
    
    // Navigate with the complete state object
    navigate(`/location/${locationId}`, { 
      state: locationData 
    });
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
    <VisibilityObserver onVisibilityChange={setIsVisible}>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
        layout={!isMobile}
      >
        <div className="flex justify-between items-start mb-2">
          <LocationHeader
            displayName={displayName}
            showOriginalName={showOriginalName}
            location={location}
            language={language}
          />
          
          <SiqsScoreBadge score={displaySiqs} loading={loadingSiqs} />
        </div>
        
        <CertificationBadge 
          certification={location.certification} 
          isDarkSkyReserve={location.isDarkSkyReserve} 
        />
        
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
        
        <RealTimeSiqsFetcher
          isVisible={isVisible}
          showRealTimeSiqs={showRealTimeSiqs}
          latitude={location.latitude}
          longitude={location.longitude}
          bortleScale={location.bortleScale}
          onSiqsCalculated={handleSiqsCalculated}
        />
      </motion.div>
    </VisibilityObserver>
  );
};

export default PhotoLocationCard;
