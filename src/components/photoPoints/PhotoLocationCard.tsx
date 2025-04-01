
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Navigation, Cloud } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import CertificationBadge from './CertificationBadge';
import SiqsRating from './SiqsRating';
import BortleScaleBadge from './BortleScaleBadge';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ location, index, showRealTimeSiqs }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Formatter for distance values
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return '';
    return distance < 10
      ? `${distance.toFixed(1)} km`
      : `${Math.round(distance)} km`;
  };
  
  // Animation variants for staggered animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  
  // Weather quality indication based on cloud cover
  const getCloudCoverStatus = () => {
    if (location.cloudCover === undefined) return null;
    
    let status = 'text-green-400';
    let label = t('Clear Skies', '晴朗天空');
    
    if (location.cloudCover > 0.7) {
      status = 'text-red-400';
      label = t('Overcast', '多云');
    } else if (location.cloudCover > 0.3) {
      status = 'text-amber-400';
      label = t('Partly Cloudy', '部分多云');
    }
    
    return { status, label };
  };
  
  const cloudStatus = getCloudCoverStatus();
  
  // Navigate to details page
  const handleViewDetails = () => {
    // Critical fix: Make sure we pass the complete location object
    // and preserve the original ID when navigating
    const locationWithMetadata = {
      ...location,
      fromPhotoPoints: true, // Add flag to indicate we're coming from photo points
      // Preserve these important fields for calculation:
      weatherData: location.weatherData || {},
      timestamp: location.timestamp || new Date().toISOString()
    };
    
    // Use the correct path structure based on the location ID
    const path = location.id.startsWith('calculated') ? 
      `/location/${location.id}` : 
      `/photo-point/${location.id}`;
    
    // Navigate with the complete state
    navigate(path, { 
      state: { 
        location: locationWithMetadata
      }
    });
  };
  
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="overflow-hidden bg-cosmic-800/50 border-cosmic-700 h-full flex flex-col">
        <CardHeader className="space-y-1 p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg line-clamp-2">
              {location.name}
            </h3>
            
            {location.isDarkSkyReserve && (
              <div className="flex-shrink-0 ml-2">
                <CertificationBadge certification={location.certification} />
              </div>
            )}
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span className="text-xs line-clamp-1">
              {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 flex-grow">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 mb-3">
              <SiqsRating siqs={location.siqs} bortleScale={location.bortleScale} />
              <BortleScaleBadge bortleScale={location.bortleScale} />
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-3">
              {location.description || t(
                "A potential location for astrophotography with good viewing conditions.",
                "一个具有良好观测条件的天文摄影潜在地点。"
              )}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-2 flex items-center justify-between bg-cosmic-950/20">
          <div className="flex items-center gap-3">
            {location.distance !== undefined && (
              <div className="flex items-center text-sm">
                <Navigation className="h-3.5 w-3.5 mr-1 text-blue-400" />
                <span>{formatDistance(location.distance)}</span>
              </div>
            )}
            
            {cloudStatus && (
              <div className="flex items-center text-sm">
                <Cloud className={`h-3.5 w-3.5 mr-1 ${cloudStatus.status}`} />
                <span className={cloudStatus.status}>{cloudStatus.label}</span>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto hover:bg-cosmic-700"
            onClick={handleViewDetails}
          >
            {t("View", "查看")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PhotoLocationCard;
