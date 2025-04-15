
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  useEffect(() => {
    console.log(`LocationView received ${locations.length} locations`);
  }, [locations]);
  
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
    const locationId = point.id || `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    
    const locationState = {
      id: locationId,
      name: point.name || 'Unnamed Location',
      chineseName: point.chineseName || '',
      latitude: point.latitude,
      longitude: point.longitude,
      bortleScale: point.bortleScale || 4,
      siqs: point.siqs,
      siqsResult: point.siqs ? { score: point.siqs } : undefined,
      certification: point.certification || '',
      isDarkSkyReserve: !!point.isDarkSkyReserve,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true
    };
    
    try {
      localStorage.setItem(`location_${locationId}`, JSON.stringify(locationState));
      console.log(`Stored location ${locationId} in localStorage before navigation`);
    } catch (error) {
      console.error("Failed to store location in localStorage:", error);
    }
    
    console.log(`Navigating to location ${locationId}`);
    navigate(`/location/${locationId}`, { state: locationState });
  };
  
  return (
    <LocationsList 
      locations={locations}
      loading={loading}
      initialLoad={initialLoad}
      onViewDetails={handleViewLocation}
    />
  );
};

export default LocationView;
