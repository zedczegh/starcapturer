
import React, { useState, useEffect, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from './PhotoLocationCard';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import SearchBar from './filters/SearchBar';
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
  const [displayLimit, setDisplayLimit] = useState(10); // Increased from 5 to 10 initially
  const [forceUpdate, setForceUpdate] = useState(false);

  // Debug the locations prop
  useEffect(() => {
    console.log(`CertifiedLocations received ${locations.length} locations`);
    if (locations.length > 0) {
      console.log('Sample location:', locations[0]);
    }
    
    // If we have fewer than expected locations, try to load all certified locations
    if (locations.length < 5 && !loading) {
      console.log('Few certified locations received, attempting to load from service directly');
      const allCertified = getAllCertifiedLocations();
      console.log(`Direct service load found ${allCertified.length} locations`);
      
      // If we found more locations than received, trigger a re-render
      if (allCertified.length > locations.length) {
        setForceUpdate(prev => !prev);
      }
    }
  }, [locations, loading]);

  // Filter locations based on search and type
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      // Filter by type if not 'all'
      if (selectedType !== 'all') {
        const certification = (location.certification || '').toLowerCase();
        const locationType = (location.type || '').toLowerCase();
        
        switch (selectedType) {
          case 'reserve':
            if (!certification.includes('reserve') && !location.isDarkSkyReserve) return false;
            break;
          case 'park':
            if (!certification.includes('park') && locationType !== 'park') return false;
            break;
          case 'community':
            if (!certification.includes('community') && locationType !== 'community') return false;
            break;
          case 'urban':
            if (!certification.includes('urban') && 
                !certification.includes('night sky place') && 
                locationType !== 'urban') return false;
            break;
          case 'lodging':
            if (!certification.includes('lodging') && 
                !certification.includes('friendly') && 
                locationType !== 'lodging') return false;
            break;
        }
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return location.name?.toLowerCase().includes(query) ||
               location.chineseName?.toLowerCase().includes(query) ||
               location.certification?.toLowerCase().includes(query);
      }
      return true;
    });
  }, [locations, selectedType, searchQuery]);

  // Get displayed locations
  const displayedLocations = useMemo(() => {
    return filteredLocations.slice(0, displayLimit);
  }, [filteredLocations, displayLimit]);

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 10);  // Load 10 more items at a time (increased from 5)
  };

  if (loading && initialLoad) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
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
        
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-xl mx-auto"
        />
        
        {filteredLocations.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            {t("No certified locations found matching your criteria.", "未找到符合条件的认证地点。")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayedLocations.map((location, index) => (
          <PhotoLocationCard
            key={location.id || `${location.latitude}-${location.longitude}-${index}`}
            location={location}
            index={index}
            onViewDetails={() => onViewDetails(location)}
            showRealTimeSiqs={true}
          />
        ))}
      </div>

      {displayedLocations.length < filteredLocations.length && (
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
      
      {/* Debug info */}
      {filteredLocations.length > 0 && (
        <div className="mt-6 text-xs text-muted-foreground text-center">
          {t(`Showing ${displayedLocations.length} of ${filteredLocations.length} locations`, 
             `显示 ${displayedLocations.length} 个，共 ${filteredLocations.length} 个地点`)}
        </div>
      )}
    </div>
  );
};

export default CertifiedLocations;
