
import React from "react";
import { useNavigate } from 'react-router-dom';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { useLanguage } from "@/contexts/LanguageContext";

// Import smaller component pieces
import CardContainer from "./cards/CardContainer";
import LocationName from "./cards/LocationName";
import DistanceDisplay from "./cards/DistanceDisplay";
import CertificationDisplay from "./cards/CertificationDisplay";
import SiqsScoreBadge from "./cards/SiqsScoreBadge";
import DetailViewButton from "./cards/DetailViewButton";

interface PhotoPointCardProps {
  point: SharedAstroSpot;
  onSelect?: (point: SharedAstroSpot) => void;
  onViewDetails?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  compact?: boolean;
  realTimeScore?: boolean;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({
  point,
  userLocation,
  compact = false,
  realTimeScore = false,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // Use the point's distance if available, otherwise calculate it
  const distance = point.distance || 
    (userLocation 
      ? calculateDistance(userLocation.latitude, userLocation.longitude, point.latitude, point.longitude) 
      : null);
  
  // Determine if this is a certified location
  const isCertified = Boolean(point.isDarkSkyReserve || point.certification);
  
  // Direct navigation to location details
  const handleViewDetails = () => {
    const locationId = point.id || `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: language === "zh" && point.chineseName ? point.chineseName : point.name,
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };
  
  return (
    <CardContainer compact={compact} onClick={handleViewDetails}>
      <div className="flex justify-between">
        <div className="flex-1 mr-3">
          <LocationName 
            name={point.name} 
            chineseName={point.chineseName}
            language={language}
            compact={compact}
          />
          
          <DistanceDisplay distance={distance} compact={compact} />
          
          <CertificationDisplay isCertified={isCertified} compact={compact} />
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <SiqsScoreBadge 
            score={point.siqs || 0} 
            compact={compact}
            realTime={realTimeScore}
          />
          
          {!compact && (
            <DetailViewButton
              onClick={(e) => {
                e.stopPropagation(); // Prevent double navigation
                handleViewDetails();
              }}
            />
          )}
        </div>
      </div>
    </CardContainer>
  );
};

export default PhotoPointCard;
