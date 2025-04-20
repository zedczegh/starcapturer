
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import EmptyLocationDisplay from '../EmptyLocationDisplay';
import LocationsList from '../LocationsList';
import { Loader2 } from 'lucide-react';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

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
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Update locations with real-time SIQS on initial load
  useEffect(() => {
    if (locations.length > 0) {
      const updateWithSiqs = async () => {
        try {
          // Apply real-time SIQS to all locations including certified ones
          const updated = await updateLocationsWithRealTimeSiqs(
            locations,
            null, // No user location needed for certified locations
            100000, // Large radius to include all locations
            'certified' // Treat all as certified to ensure they get updated
          );
          setEnhancedLocations(updated);
        } catch (err) {
          console.error("Error updating location view with real-time SIQS:", err);
          // Fallback to original locations
          setEnhancedLocations(locations);
        }
      };
      
      updateWithSiqs();
    } else {
      setEnhancedLocations([]);
    }
  }, [locations]);
  
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
  
  // Display the locations - use enhanced locations if available
  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : locations;
  
  // Display the locations
  return (
    <LocationsList 
      locations={locationsToDisplay}
      loading={loading}
      initialLoad={initialLoad}
      onViewDetails={handleViewLocation}
    />
  );
};

export default LocationView;
