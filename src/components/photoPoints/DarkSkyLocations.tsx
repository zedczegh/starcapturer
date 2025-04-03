
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';
import { motion } from 'framer-motion';
import { Loader2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DarkSkyLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
}

const DarkSkyLocations: React.FC<DarkSkyLocationsProps> = ({
  locations,
  loading,
  initialLoad
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // If loading or initial load, show loading indicator
  if (loading && initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-muted-foreground text-sm">
          {t("Loading certified dark sky locations...", "正在加载认证的暗夜地点...")}
        </p>
      </div>
    );
  }
  
  // If no locations available, show empty state
  if (locations.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex justify-center">
            <Filter className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">
            {t("No certified dark sky locations found", "未找到认证的暗夜地点")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t(
              "Try the \"Calculated\" tab to find locations with good viewing conditions.",
              "尝试\"计算\"选项卡，寻找具有良好观测条件的地点。"
            )}
          </p>
        </div>
      </div>
    );
  }
  
  // Display the locations
  return (
    <div className="space-y-4 pb-8">
      {/* Container for photo point cards */}
      <div className="grid grid-cols-1 gap-4">
        {locations.map((location, index) => (
          <motion.div
            key={location.id || `${location.latitude}-${location.longitude}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <PhotoPointCard
              point={location}
              onViewDetails={(point) => {
                const locationId = `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
                
                // Navigate to location details page
                navigate(`/location/${locationId}`, {
                  state: {
                    ...point,
                    id: locationId,
                    timestamp: new Date().toISOString()
                  }
                });
              }}
              userLocation={null} // This doesn't use current location for distance
            />
          </motion.div>
        ))}
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

export default DarkSkyLocations;
