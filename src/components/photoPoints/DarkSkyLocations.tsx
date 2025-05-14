
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Loader2 } from 'lucide-react';
import PhotoLocationCard from './PhotoLocationCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface DarkSkyLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  onLocationClick?: (location: SharedAstroSpot) => void;
}

const DarkSkyLocations: React.FC<DarkSkyLocationsProps> = ({ 
  locations, 
  loading,
  onLocationClick 
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {locations.length > 0 && (
        <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {locations.map((location) => (
            <PhotoLocationCard
              key={location.id || `${location.latitude}-${location.longitude}`}
              location={location}
              onClick={() => onLocationClick?.(location)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DarkSkyLocations;
