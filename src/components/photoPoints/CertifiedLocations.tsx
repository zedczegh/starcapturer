
import React, { useState, useEffect, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from './PhotoLocationCard';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import SearchBar from './filters/SearchBar';
import { useCertifiedLocationsLoader } from '@/hooks/photoPoints/useCertifiedLocationsLoader';
import { getAllCertifiedLocations } from '@/services/certifiedLocationsService';

interface CertifiedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  onRefresh?: () => void;
  initialLoad: boolean;
}

const CertifiedLocations: React.FC<CertifiedLocationsProps> = ({
  locations,
  loading,
  hasMore,
  onLoadMore,
  onViewDetails,
  onRefresh,
  initialLoad
}) => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<CertificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(25); // Show more initially
  
  // Get all certified locations directly from the service - use useMemo to prevent excessive recalculations
  const allCertifiedLocations = useMemo(() => getAllCertifiedLocations(), []);
  
  // Use our specialized hook to ensure we get ALL certified locations
  const {
    certifiedLocations: hookCertifiedLocations,
    isLoading: certifiedLoading,
    refreshLocations
  } = useCertifiedLocationsLoader(true);
  
  // Combine all locations sources to ensure we have all certified locations - with useMemo for performance
  const combinedLocations = useMemo(() => {
    console.log("Recalculating combined locations");
    
    // Create a map to store unique locations by coordinates
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // Process all location sources
    const processLocations = (locationsArray: SharedAstroSpot[], source: string) => {
      if (locationsArray && locationsArray.length > 0) {
        let added = 0;
        locationsArray.forEach(loc => {
          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
            // Only add if we don't already have this location
            if (!locationMap.has(key)) {
              locationMap.set(key, loc);
              added++;
            }
          }
        });
        console.log(`Added ${added} locations from ${source}`);
      }
    };
    
    // Add locations from props first
    processLocations(locations, 'props');
    
    // Then add locations from our service
    processLocations(allCertifiedLocations, 'certified service');
    
    // Then add locations from our hook
    processLocations(hookCertifiedLocations, 'certified hook');
    
    // Try to add any additional locations from session storage
    try {
      const sessionLocations = JSON.parse(sessionStorage.getItem('persistent_certified_locations') || '[]');
      processLocations(sessionLocations, 'session storage');
    } catch (e) {
      console.error("Error parsing session locations:", e);
    }
    
    // Convert back to array
    const combined = Array.from(locationMap.values());
    console.log(`Combined total: ${combined.length} unique certified locations`);
    return combined;
  }, [locations, allCertifiedLocations, hookCertifiedLocations]);
  
  // If we got more than 5 locations, use a higher display limit
  useEffect(() => {
    if (combinedLocations.length > 10 && displayLimit <= 5) {
      setDisplayLimit(30);
    }
  }, [combinedLocations.length, displayLimit]);
  
  // Handle refresh when onRefresh is called
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    refreshLocations();
  };
  
  // Filter locations based on certification type and search query - with useMemo for performance
  const filteredLocations = useMemo(() => {
    console.log("Filtering locations based on:", { selectedType, searchQuery });
    
    return combinedLocations.filter(location => {
      // First filter by certification type
      if (selectedType !== 'all') {
        const certification = (location.certification || '').toLowerCase();
        const type = location.type || '';
        
        switch (selectedType) {
          case 'reserve':
            if (!(certification.includes('reserve') || location.isDarkSkyReserve || type === 'reserve')) {
              return false;
            }
            break;
          case 'park':
            if (!(certification.includes('park') || type === 'park')) {
              return false;
            }
            break;
          case 'community':
            if (!(certification.includes('community') || type === 'community')) {
              return false;
            }
            break;
          case 'urban':
            if (!(certification.includes('urban') || type === 'urban')) {
              return false;
            }
            break;
          case 'lodging':
            if (!(certification.includes('lodging') || type === 'lodging')) {
              return false;
            }
            break;
        }
      }
      
      // Then filter by search query if present
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = location.name?.toLowerCase().includes(query) || false;
        const chineseNameMatch = location.chineseName?.toLowerCase().includes(query) || false;
        const certificationMatch = location.certification?.toLowerCase().includes(query) || false;
        
        return nameMatch || chineseNameMatch || certificationMatch;
      }
      
      return true;
    });
  }, [combinedLocations, selectedType, searchQuery]);
  
  // Handle load more
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 25); // Load more items each time
  };
  
  // Get the locations to display based on the current limit - with useMemo for performance
  const locationsToDisplay = useMemo(() => {
    return filteredLocations.slice(0, displayLimit);
  }, [filteredLocations, displayLimit]);
  
  const hasMoreToShow = displayLimit < filteredLocations.length;
  
  const isLoadingLocations = initialLoad && (loading || certifiedLoading);
  
  if (isLoadingLocations) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }
  
  if (filteredLocations.length === 0 && !isLoadingLocations) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchQuery || selectedType !== 'all' 
            ? t("No matching certified locations found.", "未找到匹配的认证地点。")
            : t("No certified dark sky locations found in this area.", "在此区域中未找到认证的暗空地点。")}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={handleRefresh}
        >
          {t("Refresh Locations", "刷新位置")}
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="space-y-4 mb-6">
        <CertificationFilter 
          selectedType={selectedType} 
          onTypeChange={setSelectedType}
        />
        
        <div className="flex gap-2 max-w-xl mx-auto">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingLocations}
            className="shrink-0"
          >
            {isLoadingLocations ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Refresh", "刷新")
            )}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          {t(
            "Showing {{shown}} of {{total}} certified dark sky locations",
            "显示 {{shown}}/{{total}} 个认证暗夜地点"
          )
            .replace('{{shown}}', String(locationsToDisplay.length))
            .replace('{{total}}', String(filteredLocations.length))
          }
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {locationsToDisplay.map((location, index) => (
          <PhotoLocationCard
            key={location.id || `${location.latitude}-${location.longitude}-${index}`}
            location={location}
            index={index}
            onViewDetails={() => onViewDetails(location)}
            showRealTimeSiqs={true}
          />
        ))}
      </div>
      
      {hasMoreToShow && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingLocations}
            className="min-w-[120px]"
          >
            {isLoadingLocations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Loading...", "加载中...")}
              </>
            ) : (
              t("Load More", "加载更多")
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CertifiedLocations;
