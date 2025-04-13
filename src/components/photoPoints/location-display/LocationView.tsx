
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import EmptyLocationDisplay from '../EmptyLocationDisplay';
import LocationsList from '../LocationsList';
import { Loader2 } from 'lucide-react';

interface LocationViewProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const LocationView: React.FC<LocationViewProps> = ({
  locations,
  loading,
  initialLoad,
  emptyTitle,
  emptyDescription
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // If loading or initial load, show loading indicator
  if (loading && initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-muted-foreground text-sm">
          {t("Loading locations...", "正在加载地点...")}
        </p>
      </div>
    );
  }
  
  // If no locations available, show empty state
  if (locations.length === 0) {
    return (
      <EmptyLocationDisplay 
        title={emptyTitle || t("No locations found", "未找到地点")}
        description={emptyDescription || t(
          "Try adjusting your search criteria.",
          "尝试调整搜索条件。"
        )}
      />
    );
  }
  
  const handleViewLocation = (point: SharedAstroSpot) => {
    const locationId = `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    
    // Navigate to location details page
    navigate(`/location/${locationId}`, {
      state: {
        ...point,
        id: locationId,
        timestamp: new Date().toISOString()
      }
    });
  };
  
  // Display the locations
  return (
    <LocationsList 
      locations={locations}
      loading={loading}
      initialLoad={initialLoad}
      onViewDetails={handleViewLocation}
      onSelectLocation={handleViewLocation}
    />
  );
};

export default LocationView;
