
import React, { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from './PhotoLocationCard';
import { Button } from '../ui/button';
import { Loader2, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CertificationFilter, { CertificationType } from './filters/CertificationFilter';
import SearchBar from './filters/SearchBar';
import { useCertifiedLocationsLoader } from '@/hooks/photoPoints/useCertifiedLocationsLoader';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [userAstroSpots, setUserAstroSpots] = useState<SharedAstroSpot[]>([]);
  const [loadingUserSpots, setLoadingUserSpots] = useState(true);
  
  // Use our specialized hook to ensure we get ALL certified locations
  const {
    certifiedLocations: allCertifiedLocations,
    isLoading: certifiedLoading,
    refreshLocations
  } = useCertifiedLocationsLoader(true);
  
  // Load user-created AstroSpots
  useEffect(() => {
    async function loadUserAstroSpots() {
      try {
        setLoadingUserSpots(true);
        const { data, error } = await supabase
          .from('user_astro_spots')
          .select('*');
        
        if (error) {
          console.error("Error loading user AstroSpots:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Convert user AstroSpots to SharedAstroSpot format
          const formattedSpots = data.map(spot => ({
            id: spot.id,
            name: spot.name,
            latitude: typeof spot.latitude === "string" ? Number(spot.latitude) : spot.latitude,
            longitude: typeof spot.longitude === "string" ? Number(spot.longitude) : spot.longitude,
            bortleScale: spot.bortlescale || 4, // Map DB 'bortlescale' to camelCase 'bortleScale'
            description: spot.description,
            timestamp: spot.created_at,
            // Set user_id to mark as user-created
            user_id: spot.user_id
          })) as SharedAstroSpot[];
          
          console.log(`Loaded ${formattedSpots.length} user AstroSpots`);
          setUserAstroSpots(formattedSpots);
        }
      } catch (err) {
        console.error("Error in user AstroSpots loading:", err);
      } finally {
        setLoadingUserSpots(false);
      }
    }
    
    loadUserAstroSpots();
  }, []);
  
  // Combine the props locations with all certified locations and user spots
  const combinedLocations = React.useMemo(() => {
    // Create a map to store unique locations by coordinates
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // First add all the locations passed in props
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
    }
    
    // Then add all certified locations from our hook
    if (allCertifiedLocations && allCertifiedLocations.length > 0) {
      allCertifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
    }
    
    // Then add all user-created AstroSpots
    if (userAstroSpots && userAstroSpots.length > 0) {
      userAstroSpots.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
    }
    
    // Convert back to array
    return Array.from(locationMap.values());
  }, [locations, allCertifiedLocations, userAstroSpots]);
  
  useEffect(() => {
    // Log the total number of combined locations
    console.log(`CertifiedLocations: Total combined locations: ${combinedLocations.length}`);
    
    // For debug: log the first 5 locations
    if (combinedLocations.length > 0) {
      console.log('First 5 locations:', combinedLocations.slice(0, 5).map(loc => loc.name || 'Unnamed'));
      
      // Log user-created AstroSpots
      const userSpots = combinedLocations.filter(loc => loc.user_id);
      if (userSpots.length > 0) {
        console.log(`Found ${userSpots.length} user-created AstroSpots:`, 
          userSpots.map(s => s.name || 'Unnamed'));
      }
    }
  }, [combinedLocations]);
  
  useEffect(() => {
    // Make sure at least 5 are shown initially (if available)
    if (combinedLocations.length > 0 && displayLimit < 5) {
      setDisplayLimit(5);
    }
  }, [combinedLocations.length]);
  
  // Filter locations based on certification type and search query
  const filteredLocations = React.useMemo(() => {
    return combinedLocations.filter(location => {
      // Always include user-created spots regardless of filter
      if (location.user_id) return true;
      
      // Filter by certification type
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
          location.certification?.toLowerCase().includes(query) ||
          location.description?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [combinedLocations, selectedType, searchQuery]);
  
  // Handle load more
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 5);
  };
  
  // Get the locations to display based on the current limit
  const locationsToDisplay = filteredLocations.slice(0, displayLimit);
  const hasMoreToShow = displayLimit < filteredLocations.length;
  
  // Log locations for debugging
  useEffect(() => {
    console.log(`CertifiedLocations: Total certified locations: ${combinedLocations.length}`);
    console.log(`CertifiedLocations: Filtered locations: ${filteredLocations.length}`);
    console.log(`CertifiedLocations: Locations to display: ${locationsToDisplay.length}`);
  }, [combinedLocations.length, filteredLocations.length, locationsToDisplay.length]);
  
  const isLoadingLocations = initialLoad && (loading || certifiedLoading || loadingUserSpots);
  
  if (isLoadingLocations) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }
  
  if (filteredLocations.length === 0 && !isLoadingLocations) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchQuery || selectedType !== 'all' 
            ? t("No matching certified locations found.", "未找到匹配的认证地点。")
            : t("No certified dark sky locations found in this area.", "在此区域中未找到认证的暗空地点。")}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={refreshLocations}
        >
          {t("Refresh Locations", "刷新位置")}
        </Button>
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
            showRealTimeSiqs={true}
          />
        ))}
      </div>
      
      {hasMoreToShow && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingLocations}
            className="min-w-[120px]"
          >
            {isLoadingLocations ? (
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
