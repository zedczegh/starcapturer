
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import CertifiedLocations from "./CertifiedLocations";
import CalculatedLocations from "./CalculatedLocations";
import PhotoPointsMap from "./map/PhotoPointsMap";
import EmptyLocationDisplay from "./EmptyLocationDisplay";
import CurrentLocationReminder from "./CurrentLocationReminder";

interface PhotoPointsViewProps {
  showMap: boolean;
  activeView: "certified" | "calculated";
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  searchRadius: number;
  calculatedSearchRadius: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqs: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (lat: number, lng: number) => void;
  canLoadMoreCalculated?: boolean;
  loadMoreCalculated?: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

// Update EmptyLocationDisplayProps to include all required properties
interface EmptyLocationDisplayProps {
  userLocation?: { latitude: number; longitude: number };
  onRefresh: () => void;
  activeView?: "certified" | "calculated";
}

const PhotoPointsView: React.FC<PhotoPointsViewProps> = ({
  showMap,
  activeView,
  initialLoad,
  effectiveLocation,
  certifiedLocations,
  calculatedLocations,
  searchRadius,
  calculatedSearchRadius,
  loading,
  hasMore,
  loadMore,
  refreshSiqs,
  onLocationClick,
  onLocationUpdate,
  canLoadMoreCalculated,
  loadMoreCalculated,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 3,
}) => {
  const { t } = useLanguage();

  // If no location is selected or available
  if (!effectiveLocation) {
    return (
      <CurrentLocationReminder />
    );
  }

  // If map view is enabled
  if (showMap) {
    return (
      <PhotoPointsMap
        userLocation={effectiveLocation}
        locations={activeView === "certified" ? certifiedLocations : calculatedLocations}
        onLocationClick={onLocationClick}
        onLocationUpdate={onLocationUpdate}
        searchRadius={activeView === "certified" ? searchRadius : calculatedSearchRadius}
      />
    );
  }

  // If calculated view is enabled
  if (activeView === "calculated") {
    return (
      <CalculatedLocations
        userLocation={effectiveLocation}
        locations={calculatedLocations}
        searchRadius={calculatedSearchRadius}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMore}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
        onLocationClick={onLocationClick}
        initialLoad={initialLoad}
        canLoadMoreCalculated={canLoadMoreCalculated}
        loadMoreCalculated={loadMoreCalculated}
      />
    );
  }

  // If certified view is enabled
  if (certifiedLocations.length === 0 && !loading) {
    return (
      <EmptyLocationDisplay
        activeView={activeView}
        userLocation={effectiveLocation}
        onRefresh={refreshSiqs}
      />
    );
  }

  return (
    <CertifiedLocations
      locations={certifiedLocations}
      loading={loading}
      onLocationClick={onLocationClick}
    />
  );
};

export default PhotoPointsView;
