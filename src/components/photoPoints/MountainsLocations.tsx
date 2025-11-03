import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import PhotoLocationCard from './PhotoLocationCard';
import { Loader2, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';

interface MountainsLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  onRefresh?: () => void;
  initialLoad?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

const MountainsLocations: React.FC<MountainsLocationsProps> = ({
  locations,
  loading,
  onViewDetails,
  initialLoad = false,
  userLocation
}) => {
  const { t } = useLanguage();

  // Sort locations by SIQS score (high to low)
  const sortedLocations = React.useMemo(() => {
    // Clone to avoid mutating original array
    const sorted = [...locations];
    
    // Sort by SIQS score (high to low)
    sorted.sort((a, b) => {
      const siqsA = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
      const siqsB = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
      return siqsB - siqsA; // Descending order
    });

    return sorted;
  }, [locations]);

  if (loading && initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
        <p className="text-muted-foreground">
          {t("Loading mountain locations...", "正在加载山峰位置...")}
        </p>
      </div>
    );
  }

  if (!sortedLocations || sortedLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mountain className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg font-medium text-foreground">
          {t("No mountain locations available", "暂无山峰位置")}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {t(
            "Mountain locations are being loaded",
            "山峰位置正在加载中"
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
            {t("Famous Mountains", "著名山峰")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              `${sortedLocations.length} iconic peaks from around the world`,
              `来自世界各地的 ${sortedLocations.length} 座标志性山峰`
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sortedLocations.map((location, index) => (
          <motion.div
            key={location.id || `${location.latitude}-${location.longitude}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <PhotoLocationCard
              location={location}
              index={index}
              onViewDetails={onViewDetails}
              showRealTimeSiqs={true}
              userLocation={userLocation}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MountainsLocations;
