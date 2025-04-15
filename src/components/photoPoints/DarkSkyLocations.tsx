
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationView from './location-display/LocationView';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import LocationPagination from './pagination/LocationPagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCertificationType]);
  
  // Debug logging for certified locations
  useEffect(() => {
    console.log(`DarkSkyLocations received ${locations.length} certified locations`);
    
    if (locations.length > 0) {
      // Log the first few locations for debugging
      const sampleLocations = locations.slice(0, Math.min(3, locations.length));
      console.log("Sample certified locations:", sampleLocations.map(loc => ({
        name: loc.name,
        cert: loc.certification,
        isDarkSky: loc.isDarkSkyReserve
      })));
    }
  }, [locations]);
  
  // Filter locations based on selected certification type
  const filteredLocations = useMemo(() => {
    if (selectedCertificationType === 'all') {
      return locations;
    }
    
    return locations.filter(location => {
      // Never filter out locations that have a certification or are dark sky reserves
      if (!location.certification && !location.isDarkSkyReserve) {
        return false;
      }
      
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
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  
  // Get current page items
  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLocations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLocations, currentPage, itemsPerPage]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the list when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div>
      <CertificationFilter 
        selectedType={selectedCertificationType} 
        onTypeChange={setSelectedCertificationType} 
      />
      
      <LocationView
        locations={paginatedLocations}
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
      
      {filteredLocations.length > 0 && (
        <div className="flex justify-center mt-4">
          <LocationPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
      {filteredLocations.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-2 mb-4">
          {t("Showing {{start}}-{{end}} of {{total}} locations", "显示第 {{start}}-{{end}} 个位置，共 {{total}} 个").replace('{{start}}', String((currentPage - 1) * itemsPerPage + 1))
           .replace('{{end}}', String(Math.min(currentPage * itemsPerPage, filteredLocations.length)))
           .replace('{{total}}', String(filteredLocations.length))}
        </div>
      )}
    </div>
  );
};

export default DarkSkyLocations;
