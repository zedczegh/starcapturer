
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationView from './location-display/LocationView';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';

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
  const [selectedCertificationType, setSelectedCertificationType] = useState<CertificationType>('all');
  
  // Filter locations based on selected certification type
  const filteredLocations = useMemo(() => {
    if (selectedCertificationType === 'all') {
      return locations;
    }
    
    return locations.filter(location => {
      const certification = (location.certification || '').toLowerCase();
      
      switch (selectedCertificationType) {
        case 'reserve':
          return certification.includes('reserve') || 
                 certification.includes('sanctuary') ||
                 Boolean(location.isDarkSkyReserve);
        case 'park':
          return certification.includes('park');
        case 'community':
          return certification.includes('community');
        case 'urban':
          return certification.includes('urban') || 
                 certification.includes('night sky place');
        case 'lodging':
          return certification.includes('lodging');
        default:
          return true;
      }
    });
  }, [locations, selectedCertificationType]);
  
  return (
    <div>
      <CertificationFilter 
        selectedType={selectedCertificationType} 
        onTypeChange={setSelectedCertificationType} 
      />
      
      <LocationView
        locations={filteredLocations}
        loading={loading}
        initialLoad={initialLoad}
        emptyTitle={
          selectedCertificationType === 'all' 
          ? t("No certified dark sky locations found", "未找到认证的暗夜地点") 
          : t("No matching certified locations found", "未找到匹配的认证地点")
        }
        emptyDescription={
          selectedCertificationType === 'all'
          ? t("Try the \"Calculated\" tab to find locations with good viewing conditions.", "尝试\"计算\"选项卡，寻找具有良好观测条件的地点。")
          : t("Try selecting a different certification type or switch to the \"Calculated\" tab.", "尝试选择不同的认证类型或切换到\"计算\"选项卡。")
        }
      />
    </div>
  );
};

export default DarkSkyLocations;
