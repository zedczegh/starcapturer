
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationView from './location-display/LocationView';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import SearchBar from './filters/SearchBar';
import { matchesCertificationType } from '@/utils/certificationUtils';
import { preloadCertifiedLocations, forceCertifiedLocationsRefresh } from '@/services/certifiedLocationsService';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  
  // Ensure we load all IDA locations from our certified locations service
  useEffect(() => {
    const loadAllCertifiedLocations = async () => {
      try {
        const certifiedLocations = await preloadCertifiedLocations();
        console.log(`Loaded ${certifiedLocations.length} certified locations from the service`);
        
        // Combine with any locations passed from props, avoiding duplicates
        const locationMap = new Map<string, SharedAstroSpot>();
        
        // First add the manually passed locations
        if (Array.isArray(locations)) {
          locations.forEach(location => {
            if (location.latitude && location.longitude) {
              const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
              locationMap.set(key, location);
            }
          });
        }
        
        // Then add all certified locations, potentially overriding with more complete data
        certifiedLocations.forEach(location => {
          if (location.latitude && location.longitude) {
            const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
            locationMap.set(key, location);
          }
        });
        
        // Convert back to array
        const combinedLocations = Array.from(locationMap.values());
        console.log(`Total combined certified locations: ${combinedLocations.length}`);
        setAllLocations(combinedLocations);
        
      } catch (error) {
        console.error("Failed to load certified locations:", error);
        // Fallback to provided locations
        setAllLocations(locations || []);
      }
    };
    
    loadAllCertifiedLocations();
  }, [locations]);
  
  // Handle manual refresh
  const handleRefreshLocations = async () => {
    setIsRefreshing(true);
    toast.info(t("Refreshing certified locations...", "正在刷新认证地点..."));
    
    try {
      const refreshedLocations = await forceCertifiedLocationsRefresh();
      setAllLocations(refreshedLocations);
      toast.success(t(
        `Successfully loaded ${refreshedLocations.length} certified locations`,
        `成功加载了 ${refreshedLocations.length} 个认证地点`
      ));
    } catch (error) {
      console.error("Error refreshing certified locations:", error);
      toast.error(t("Failed to refresh certified locations", "刷新认证地点失败"));
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter certified locations based on certification type and search query
  const filteredLocations = useMemo(() => {
    if (!Array.isArray(allLocations)) return [];
    
    console.log(`Filtering ${allLocations.length} locations with search query: ${searchQuery} and type: ${selectedCertificationType}`);
    
    return allLocations.filter(location => {
      // First filter by certification type
      if (selectedCertificationType !== 'all' && !matchesCertificationType(location, selectedCertificationType)) {
        return false;
      }
      
      // Then filter by search query if present
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        // Check English name
        const matchName = location.name?.toLowerCase().includes(query);
        
        // Check Chinese name
        const matchChineseName = location.chineseName?.toLowerCase().includes(query);
        
        // Check certification text
        const matchCertification = location.certification?.toLowerCase().includes(query);
        
        return matchName || matchChineseName || matchCertification;
      }
      
      return true;
    });
  }, [allLocations, selectedCertificationType, searchQuery]);
  
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <CertificationFilter 
          selectedType={selectedCertificationType} 
          onTypeChange={setSelectedCertificationType} 
        />
        
        <div className="flex items-center max-w-xl mx-auto gap-2">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
          />
          
          <Button
            variant="outline" 
            size="sm"
            onClick={handleRefreshLocations}
            disabled={isRefreshing}
            className="shrink-0"
          >
            <RefreshCcw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t("Refresh", "刷新")}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          {t(
            "Showing {{count}} certified dark sky locations",
            "显示 {{count}} 个认证暗夜地点"
          ).replace('{{count}}', String(filteredLocations.length))}
        </div>
      </div>
      
      <LocationView
        locations={filteredLocations}
        loading={loading || isRefreshing}
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
