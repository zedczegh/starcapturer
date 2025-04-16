
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationView from './location-display/LocationView';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import SearchBar from './filters/SearchBar';
import { matchesCertificationType } from '@/utils/certificationUtils';

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
  const { t, language } = useLanguage();
  const [selectedCertificationType, setSelectedCertificationType] = useState<CertificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter certified locations based on certification type and search query
  const filteredLocations = useMemo(() => {
    if (!Array.isArray(locations)) return [];
    
    return locations.filter(location => {
      // First filter by certification type
      if (selectedCertificationType !== 'all' && !matchesCertificationType(location, selectedCertificationType)) {
        return false;
      }
      
      // Then filter by search query if present
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = location.name?.toLowerCase().includes(query);
        const matchChineseName = location.chineseName?.toLowerCase().includes(query);
        return matchName || matchChineseName;
      }
      
      return true;
    });
  }, [locations, selectedCertificationType, searchQuery]);
  
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <CertificationFilter 
          selectedType={selectedCertificationType} 
          onTypeChange={setSelectedCertificationType} 
        />
        
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-xl mx-auto"
        />
      </div>
      
      <LocationView
        locations={filteredLocations}
        loading={loading}
        initialLoad={initialLoad}
        emptyTitle={
          searchQuery
            ? t("No matching dark sky locations found", "未找到匹配的暗夜地点")
            : selectedCertificationType === 'all' 
              ? t("No certified dark sky locations found", "未找到认证的暗夜地点") 
              : t("No matching certified locations found", "未找到匹配的认证地点")
        }
        emptyDescription={
          searchQuery
            ? t("Try different search terms or clear the search", "尝试不同的搜索词或清除搜索")
            : selectedCertificationType === 'all'
              ? t("Try the \"Calculated\" tab to find locations with good viewing conditions.", "尝试\"计算\"选项卡，寻找具有良好观测条件的地点。")
              : t("Try selecting a different certification type or switch to the \"Calculated\" tab.", "尝试选择不同的认证类型或切换到\"计算\"选项卡。")
        }
      />
    </div>
  );
};

export default DarkSkyLocations;
