
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
  const [totalLocations, setTotalLocations] = useState(0);
  const locationsPerPage = 50; // Increased from 20 to 50 to show more locations per page
  
  useEffect(() => {
    console.log(`LocationView received ${locations.length} locations`);
    // Store the total count of locations
    setTotalLocations(locations.length);
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
  
  // Function to generate page numbers with proper ellipsis
  const generatePaginationItems = () => {
    // For small number of pages, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always include first and last pages
    const pages = [1];
    
    // Logic for showing pages around current page with ellipsis
    if (currentPage <= 3) {
      // Near start: show 1, 2, 3, 4, 5, ..., totalPages
      pages.push(2, 3, 4, 5, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end: show 1, ..., totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
      pages.push('ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // Middle: show 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
      pages.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    
    return pages;
  };
  
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4 flex flex-wrap justify-between items-center">
        <span>
          {t("Showing {{start}}-{{end}} of {{total}} locations", "显示 {{start}}-{{end}}，共 {{total}} 个位置")
            .replace('{{start}}', String(indexOfFirstLocation + 1))
            .replace('{{end}}', String(Math.min(indexOfLastLocation, locations.length)))
            .replace('{{total}}', String(totalLocations))}
        </span>
        <span className="text-xs mt-1 italic">
          {t("Total certified locations: {{count}}", "认证地点总数: {{count}}")
            .replace('{{count}}', String(totalLocations))}
        </span>
      </div>
      
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
            
            {generatePaginationItems().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <span className="px-2">...</span>
                  </PaginationItem>
                );
              }
              
              return (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => handlePageChange(page as number)}
                    aria-label={t(`Page ${page}`, `第${page}页`)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
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
