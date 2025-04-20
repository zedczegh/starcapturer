
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
  const [displayLimit, setDisplayLimit] = useState(5);

  // Filter locations based on search and type
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      // Filter by type if not 'all'
      if (selectedType !== 'all') {
        const certification = (location.certification || '').toLowerCase();
        switch (selectedType) {
          case 'reserve':
            if (!certification.includes('reserve') && !location.isDarkSkyReserve) return false;
            break;
          case 'park':
            if (!certification.includes('park')) return false;
            break;
          case 'community':
            if (!certification.includes('community')) return false;
            break;
          case 'urban':
            if (!certification.includes('urban')) return false;
            break;
          case 'lodging':
            if (!certification.includes('lodging')) return false;
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
    setDisplayLimit(prev => prev + 5);
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
    </div>
  );
};

export default CertifiedLocations;
