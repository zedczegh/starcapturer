import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import PhotoLocationCard from './PhotoLocationCard';
import { Loader2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ObscuraLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  onRefresh?: () => void;
  initialLoad?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

const ObscuraLocations: React.FC<ObscuraLocationsProps> = ({
  locations,
  loading,
  onViewDetails,
  initialLoad = false,
  userLocation
}) => {
  const { t } = useLanguage();

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Sort locations: prioritize nearby (within 1000km) with high SIQS (>6) first
  const sortedLocations = React.useMemo(() => {
    if (!userLocation) return locations;

    const priorityLocations: SharedAstroSpot[] = [];
    const otherLocations: SharedAstroSpot[] = [];

    locations.forEach(location => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      const siqs = typeof location.siqs === 'number' ? location.siqs : (location.siqs?.score || 0);

      if (distance <= 1000 && siqs > 6) {
        priorityLocations.push(location);
      } else {
        otherLocations.push(location);
      }
    });

    // Sort priority locations by distance (nearest first)
    priorityLocations.sort((a, b) => {
      const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
      const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
      return distA - distB;
    });

    return [...priorityLocations, ...otherLocations];
  }, [locations, userLocation]);

  if (loading && initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-4" />
        <p className="text-muted-foreground">
          {t("Loading Atlas Obscura locations...", "正在加载奇观位置...")}
        </p>
      </div>
    );
  }

  if (!sortedLocations || sortedLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Eye className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg font-medium text-foreground">
          {t("No Atlas Obscura locations available", "暂无奇观位置")}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {t(
            "Atlas Obscura locations are being loaded",
            "奇观位置正在加载中"
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-teal-600">
            {t("Atlas Obscura Locations", "奇观位置")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              `${sortedLocations.length} fascinating places from around the world`,
              `来自世界各地的 ${sortedLocations.length} 个迷人地点`
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ObscuraLocations;
