
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationView from './location-display/LocationView';

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
  
  return (
    <LocationView
      locations={locations}
      loading={loading}
      initialLoad={initialLoad}
      emptyTitle={t("No certified dark sky locations found", "未找到认证的暗夜地点")}
      emptyDescription={t(
        "Try the \"Calculated\" tab to find locations with good viewing conditions.",
        "尝试\"计算\"选项卡，寻找具有良好观测条件的地点。"
      )}
    />
  );
};

export default DarkSkyLocations;
