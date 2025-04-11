
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationsListProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
  onViewDetails: (point: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const LocationsList: React.FC<LocationsListProps> = ({
  locations,
  loading,
  initialLoad,
  onViewDetails,
  userLocation
}) => {
  const { t } = useLanguage();
  
  if (locations.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">
          {t("No locations found", "未找到位置")}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pb-8">
      {/* Container for photo point cards */}
      <div className="grid grid-cols-1 gap-4">
        {locations.map((location, index) => {
          // Ensure we have valid coordinates
          if (!location.latitude || !location.longitude) {
            return null;
          }
          
          return (
            <motion.div
              key={location.id || `${location.latitude}-${location.longitude}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PhotoPointCard
                point={location}
                onViewDetails={onViewDetails}
                userLocation={userLocation}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Loading state for additional locations */}
      {loading && !initialLoad && (
        <div className="flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default LocationsList;
