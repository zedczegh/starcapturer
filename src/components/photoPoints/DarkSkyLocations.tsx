
import React, { useState, useMemo, useEffect } from 'react';
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
  
  // Debug logging for certified locations
  useEffect(() => {
    console.log(`DarkSkyLocations received ${locations.length} certified locations`);
    
    if (locations.length > 0) {
      // Count by certification type for debugging
      const certTypes = {
        reserve: 0,
        park: 0,
        community: 0,
        urban: 0,
        lodging: 0,
        other: 0
      };
      
      locations.forEach(loc => {
        const cert = (loc.certification || '').toLowerCase();
        if (cert.includes('reserve') || Boolean(loc.isDarkSkyReserve)) {
          certTypes.reserve++;
        } else if (cert.includes('park')) {
          certTypes.park++;
        } else if (cert.includes('community')) {
          certTypes.community++;
        } else if (cert.includes('urban') || cert.includes('night sky place')) {
          certTypes.urban++;
        } else if (cert.includes('lodging')) {
          certTypes.lodging++;
        } else {
          certTypes.other++;
        }
      });
      
      console.log("Certification type counts:", certTypes);
    }
  }, [locations]);
  
  // Filter locations based on certification type ONLY - no distance limits applied
  const filteredLocations = useMemo(() => {
    if (selectedCertificationType === 'all') {
      return locations;
    }
    
    return locations.filter(location => {
      // Skip locations without any certification
      if (!location.certification && !location.isDarkSkyReserve) {
        return false;
      }
      
      const certification = (location.certification || '').toLowerCase();
      
      // Check certification type with expanded matching
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
  
  // Log filtered results for debugging
  useEffect(() => {
    console.log(`Filtered to ${filteredLocations.length} ${selectedCertificationType} locations`);
  }, [filteredLocations, selectedCertificationType]);
  
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
