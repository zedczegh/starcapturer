
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import EmptyLocationDisplay from '../EmptyLocationDisplay';
import LocationsList from '../LocationsList';
import { Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const locationsPerPage = 10;
  
  useEffect(() => {
    console.log(`LocationView received ${locations.length} locations`);
    // Reset to page 1 when locations data changes
    setCurrentPage(1);
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
  
  // Calculate pagination values
  const totalPages = Math.ceil(locations.length / locationsPerPage);
  const indexOfLastLocation = currentPage * locationsPerPage;
  const indexOfFirstLocation = indexOfLastLocation - locationsPerPage;
  
  // Get current page locations
  const currentLocations = locations.slice(indexOfFirstLocation, indexOfLastLocation);
  
  const handlePageChange = (pageNumber: number) => {
    window.scrollTo(0, 0);
    setCurrentPage(pageNumber);
  };
  
  return (
    <div className="space-y-6">
      <LocationsList 
        locations={currentLocations}
        loading={loading}
        initialLoad={initialLoad}
        onViewDetails={handleViewLocation}
      />
      
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label={t("Previous page", "上一页")}
                />
              </PaginationItem>
            )}
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => handlePageChange(page)}
                  aria-label={t(`Page ${page}`, `第${page}页`)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label={t("Next page", "下一页")}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default LocationView;
