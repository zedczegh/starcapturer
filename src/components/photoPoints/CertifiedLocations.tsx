
import React, { useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from './PhotoLocationCard';
import { Button } from '../ui/button';
import { Loader2, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import SearchBar from './filters/SearchBar';

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
  initialLoad
}) => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<CertificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(5);
  
  // Filter locations based on certification type and search query
  const filteredLocations = locations.filter(location => {
    // First filter by certification type
    if (selectedType !== 'all') {
      const certification = (location.certification || '').toLowerCase();
      switch (selectedType) {
        case 'reserve':
          return certification.includes('reserve') || location.isDarkSkyReserve;
        case 'park':
          return certification.includes('park');
        case 'community':
          return certification.includes('community');
        case 'urban':
          return certification.includes('urban');
        case 'lodging':
          return certification.includes('lodging');
        default:
          return true;
      }
    }
    
    // Then filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        location.name?.toLowerCase().includes(query) ||
        location.chineseName?.toLowerCase().includes(query) ||
        location.certification?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Handle load more
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 5);
  };
  
  // Get the locations to display based on the current limit
  const locationsToDisplay = filteredLocations.slice(0, displayLimit);
  const hasMoreToShow = displayLimit < filteredLocations.length;
  
  if (initialLoad && loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }
  
  if (filteredLocations.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchQuery || selectedType !== 'all' 
            ? t("No matching certified locations found.", "未找到匹配的认证地点。")
            : t("No certified dark sky locations found in this area.", "在此区域中未找到认证的暗空地点。")}
        </p>
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
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {locationsToDisplay.map((location, index) => (
          <PhotoLocationCard
            key={location.id || `${location.latitude}-${location.longitude}-${index}`}
            location={location}
            index={index}
            onViewDetails={() => onViewDetails(location)}
          />
        ))}
      </div>
      
      {hasMoreToShow && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
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
