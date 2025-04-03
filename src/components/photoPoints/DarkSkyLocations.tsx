
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointCard from './PhotoPointCard';
import { motion } from 'framer-motion';
import { Loader2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyLocationDisplay from './EmptyLocationDisplay';
import LocationsList from './LocationsList';

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
      <EmptyLocationDisplay 
        title={t("No certified dark sky locations found", "未找到认证的暗夜地点")}
        description={t(
          "Try the \"Calculated\" tab to find locations with good viewing conditions.",
          "尝试\"计算\"选项卡，寻找具有良好观测条件的地点。"
        )}
      />
    );
  }
  
  const handleViewLocation = (point: SharedAstroSpot) => {
    const locationId = `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    
    // Navigate to location details page
    navigate(`/location/${locationId}`, {
      state: {
        ...point,
        id: locationId,
        timestamp: new Date().toISOString()
      }
    });
  };
  
  // Display the locations
  return (
    <LocationsList 
      locations={locations}
      loading={loading}
      initialLoad={initialLoad}
      onViewDetails={handleViewLocation}
    />
  );
};

export default DarkSkyLocations;
