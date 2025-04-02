
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCertificationInfo, useDistanceFormatter } from './utils/certificationUtils';
import SIQSBadge from '@/components/siqs/SIQSBadge';
import BortleBadge from '@/components/bortle/BortleBadge';
import { isGoodViewingCondition } from '@/hooks/siqs/siqsCalculationUtils';

interface PhotoPointCardProps {
  location: {
    id?: string;
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
    siqsScore?: number;
    bortleScale?: number;
    certification?: string;
    isDarkSkyReserve?: boolean;
    photoPoint?: boolean;
    addedDate?: string;
  };
  compact?: boolean;
  className?: string;
  hideViewDetails?: boolean;
  onSelect?: (location: any) => void;
  onViewDetails?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({
  location,
  compact = false,
  className = '',
  hideViewDetails = false,
  onSelect,
  onViewDetails,
  userLocation
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const formatDistance = useDistanceFormatter();
  const certificationInfo = useCertificationInfo(location.certification, location.isDarkSkyReserve);
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    
    if (onSelect) {
      onSelect(location);
      return;
    }
    
    if (location.id) {
      navigate(`/location/${location.id}`, { 
        state: {
          ...location,
          fromPhotoPoints: true
        }
      });
    } else {
      // Create a temporary ID for sharing URL
      const tempId = `temp-${Date.now()}`;
      navigate(`/location/${tempId}`, { 
        state: {
          ...location,
          id: tempId,
          fromPhotoPoints: true
        }
      });
    }
  };
  
  const isGoodCondition = location.siqsScore ? isGoodViewingCondition(location.siqsScore) : false;
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${isGoodCondition ? 'border-green-400/40' : 'border-slate-700'} ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-medium truncate mr-2">
            {location.name}
          </h3>
          <div className="flex gap-1.5">
            {location.siqsScore !== undefined && (
              <SIQSBadge score={location.siqsScore} size="sm" />
            )}
            {location.bortleScale !== undefined && (
              <BortleBadge value={location.bortleScale} size="sm" />
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="text-xs">
              {formatDistance(location.distance)}
            </span>
          </div>
          
          {certificationInfo && (
            <div className="flex items-center">
              {certificationInfo.icon}
              <span className={`text-xs ${certificationInfo.color}`}>
                {certificationInfo.text}
              </span>
            </div>
          )}
          
          {location.photoPoint && (
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              <span className="text-xs text-amber-400">
                {t("Recommended Photo Spot", "推荐拍摄点")}
              </span>
            </div>
          )}
          
          {location.addedDate && (
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <span className="text-xs">
                {new Date(location.addedDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {!hideViewDetails && !compact && (
          <div className="mt-3 pt-3 border-t border-cosmic-800">
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-full bg-cosmic-800/70 hover:bg-cosmic-700/70"
              onClick={handleViewDetails}
            >
              {t("See Details", "查看详情")}
            </Button>
          </div>
        )}
        
        {hideViewDetails && onSelect && (
          <div className="mt-3 pt-3 border-t border-cosmic-800">
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-full bg-cosmic-800/70 hover:bg-cosmic-700/70"
              onClick={() => onSelect(location)}
            >
              {t("Select Location", "选择位置")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PhotoPointCard;
