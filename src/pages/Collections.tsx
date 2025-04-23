
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import { sortLocationsBySiqs } from "./collections/sortLocationsBySiqs";
import PageLoader from "@/components/loaders/PageLoader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";
import AboutFooter from '@/components/about/AboutFooter';
import { useUserCollections } from "@/hooks/collections/useUserCollections";
import { getBortleScaleForCoords } from "@/utils/getBortleScaleForCoords";

const Collections = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [bortleMap, setBortleMap] = useState<Record<string, number | null>>({});
  const [fetchingBortle, setFetchingBortle] = useState(false);

  const {
    locations,
    setLocations,
    loading,
    authChecked,
    error,
    removeLocationImmediately,
  } = useUserCollections();

  const handleDelete = async (locationId: string) => {
    removeLocationImmediately(locationId);
    try {
      const { error: dbError } = await import("@/integrations/supabase/client")
        .then((mod) => mod.supabase)
        .then((supabase) =>
          supabase
            .from("saved_locations")
            .delete()
            .eq("id", locationId)
        );
      if (dbError) throw dbError;
      toast.success(t("Location removed from collection", "位置已从收藏中删除"));
    } catch (err) {
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  const handleViewDetails = (location: SharedAstroSpot) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
    }
  };

  // Fetch Bortle scale data for all locations
  useEffect(() => {
    let mounted = true;
    
    const fetchBortleScales = async () => {
      if (!locations || locations.length === 0) return;
      
      setFetchingBortle(true);
      const updatedBortles: Record<string, number | null> = {};
      
      // Process locations in small batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (location) => {
            if (!location.latitude || !location.longitude) return;
            
            // Only fetch if we don't already have a valid Bortle scale
            if (typeof location.bortleScale !== 'number' || 
                location.bortleScale < 1 || 
                location.bortleScale > 9) {
              try {
                const bortleScale = await getBortleScaleForCoords(
                  location.latitude,
                  location.longitude,
                  location.name || ''
                );
                
                if (mounted) {
                  updatedBortles[location.id] = bortleScale;
                }
              } catch (err) {
                console.error(`Error fetching Bortle scale for ${location.name}:`, err);
              }
            } else {
              // Use the existing valid Bortle scale
              updatedBortles[location.id] = location.bortleScale;
            }
          })
        );
        
        // Update state after each batch and wait briefly to avoid API rate limits
        if (mounted) {
          setBortleMap(prev => ({ ...prev, ...updatedBortles }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (mounted) {
        setFetchingBortle(false);
      }
    };
    
    fetchBortleScales();
    
    return () => { mounted = false; };
  }, [locations]);

  if (!authChecked) return <PageLoader />;

  if (locations === null) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <LocationStatusMessage
            message={t("Please sign in to view your collections", "请登录以查看您的收藏")}
            type="error"
          />
        </div>
      </div>
    );
  }

  const sortedLocations = sortLocationsBySiqs(locations);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <TooltipProvider>
        <main className="container mx-auto px-4 py-8 pt-16 md:pt-20 flex-grow">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("My Collections", "我的收藏")}
            </h1>
            {sortedLocations.length > 0 && (
              <button
                className="bg-cosmic-800 text-white rounded-full px-4 py-1 text-sm font-medium border border-cosmic-600 shadow hover:bg-cosmic-700 transition"
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? t("Done", "完成") : t("Edit", "编辑")}
              </button>
            )}
          </div>

          {error && <LocationStatusMessage message={error} type="error" />}

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedLocations.length === 0 ? (
            <div className="text-center py-12 bg-cosmic-800/50 rounded-lg border border-cosmic-700/50">
              <div className="mb-4 text-muted-foreground">
                {t("You haven't saved any locations yet.", "您还没有保存任何位置。")}
              </div>
              <button
                onClick={() => navigate('/photo-points')}
                className="text-primary hover:underline"
              >
                {t("Browse Photo Points", "浏览摄影点")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedLocations.map((location, index) => {
                const overrideBortleScale = bortleMap[location.id];
                // Create a modified location with the updated Bortle scale
                const effectiveLocation = {
                  ...location,
                  bortleScale: typeof overrideBortleScale === 'number' ? overrideBortleScale : location.bortleScale
                };
                
                return (
                  <div key={location.id} className="relative group">
                    {editMode && (
                      <MiniRemoveButton onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(location.id);
                      }}/>
                    )}
                    <PhotoLocationCard
                      location={effectiveLocation}
                      index={index}
                      onViewDetails={handleViewDetails}
                      showRealTimeSiqs={true}
                    />
                    {fetchingBortle && overrideBortleScale === undefined && (
                      <div className="absolute right-2 top-2 z-10 bg-background/80 rounded-full p-1">
                        <Loader className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </TooltipProvider>
      <AboutFooter />
    </div>
  );
};

export default Collections;
