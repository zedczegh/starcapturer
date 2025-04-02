
import React, { useState } from 'react';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCertificationInfo, useDistanceFormatter } from './utils/certificationUtils';
import SIQSBadge from '@/components/siqs/SIQSBadge';
import BortleBadge from '@/components/bortle/BortleBadge';
import { isGoodViewingCondition } from '@/hooks/siqs/siqsCalculationUtils';

interface PhotoPointCardProps {
  point: any;
  onSelect?: (point: any) => void;
  onViewDetails?: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  isPreview?: boolean;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({
  point,
  onSelect,
  onViewDetails,
  userLocation,
  isPreview = false
}) => {
  const { language, t } = useLanguage();
  const [isHovering, setIsHovering] = useState(false);
  const formatDistance = useDistanceFormatter();
  
  const certificationInfo = point.certification || point.isDarkSkyReserve
    ? useCertificationInfo(point.certification, point.isDarkSkyReserve)
    : null;
  
  // Show placeholder if point is missing crucial info
  if (!point || !point.latitude || !point.longitude) {
    return <PhotoPointCardSkeleton />;
  }
  
  const name = language === 'zh' && point.chineseName ? point.chineseName : point.name;
  const distance = userLocation 
    ? haversineDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        point.latitude, 
        point.longitude
      ) 
    : null;
  
  const isGoodSiqs = typeof point.siqs === 'number' && isGoodViewingCondition(point.siqs);
    
  return (
    <motion.div
      className={`rounded-xl overflow-hidden group transition-all ${
        isPreview ? 'border-0' : 'border border-cosmic-700/30'
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={`p-4 ${
        isGoodSiqs 
          ? 'bg-gradient-to-r from-cosmic-900/90 to-cosmic-800/90 hover:from-cosmic-900/95 hover:to-cosmic-800/95' 
          : 'bg-gradient-to-r from-cosmic-900/80 to-cosmic-800/80 hover:from-cosmic-900/90 hover:to-cosmic-800/90'
      } transition-all duration-300`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className={`rounded-full p-2 flex-shrink-0 self-start ${
            isGoodSiqs 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            {isGoodSiqs ? <Star className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-50 truncate">{name}</h3>
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {distance !== null && (
                    <Badge variant="outline" className="text-[0.65rem] py-0 font-normal text-gray-300 bg-gray-800/40">
                      {formatDistance(distance)}
                    </Badge>
                  )}
                  
                  {certificationInfo && (
                    <Badge
                      className={`text-[0.65rem] py-0 flex items-center gap-1 font-normal ${certificationInfo.color}`}
                    >
                      {certificationInfo.icon}
                      {certificationInfo.text}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-0 sm:ml-2">
                {point.siqs && <SIQSBadge score={point.siqs} />}
                {typeof point.bortleScale === 'number' && <BortleBadge value={point.bortleScale} />}
              </div>
            </div>
            
            <div className="flex items-center justify-between flex-row-reverse mt-2">
              <AnimatePresence>
                {!isPreview && (
                  <Button
                    size="sm"
                    className="px-4 h-8 text-sm bg-blue-600/40 hover:bg-blue-600/60 text-white hover:text-white transition-colors"
                    onClick={() => {
                      if (onSelect) onSelect(point);
                      if (onViewDetails) onViewDetails();
                    }}
                  >
                    {t("See More Details", "查看详情")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </AnimatePresence>
              
              {point.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mr-2 max-w-[70%]">
                  {point.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PhotoPointCardSkeleton = () => (
  <div className="rounded-xl overflow-hidden border border-cosmic-700/30">
    <div className="p-4 bg-gradient-to-r from-cosmic-900/80 to-cosmic-800/80">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between pt-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Calculate haversine distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default React.memo(PhotoPointCard);
