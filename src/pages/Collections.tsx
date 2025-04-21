
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader, RefreshCw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Collections = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const { user } = useAuth();

  // Use new efficient collections hook
  const {
    locations,
    setLocations,
    loading,
    authChecked,
    error,
    removeLocationImmediately,
    retryLoading,
    resetState
  } = useUserCollections();

  // Ensure we reset state on unmount to prevent stale state
  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const handleDelete = async (locationId: string) => {
    // Remove from UI and cache immediately for snappy feel
    removeLocationImmediately(locationId);
    try {
      // Optimistically delete on Supabase; does not restore in UI on error for now
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

  if (!authChecked) return <PageLoader />;

  // If the user isn't logged in, show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <div className="flex flex-col items-center justify-center space-y-4 py-12 bg-cosmic-800/50 rounded-lg border border-cosmic-700/50">
            <LocationStatusMessage
              message={t("Please sign in to view your collections", "请登录以查看您的收藏")}
              type="error"
            />
            <Button 
              variant="default" 
              onClick={() => navigate('/')} 
              className="mt-4"
            >
              {t("Go to Home", "返回首页")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show sorted locations, even if empty
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
            {sortedLocations.length > 0 && !loading && (
              <div className="flex space-x-2">
                <Button
                  className="bg-cosmic-800 text-white rounded-full px-4 py-1 text-sm font-medium border border-cosmic-600 shadow hover:bg-cosmic-700 transition"
                  onClick={() => setEditMode((v) => !v)}
                >
                  {editMode ? t("Done", "完成") : t("Edit", "编辑")}
                </Button>
              </div>
            )}
          </div>

          {error ? (
            <div className="text-center py-12 bg-cosmic-800/50 rounded-lg border border-cosmic-700/50">
              <LocationStatusMessage message={error} type="error" />
              <Button 
                variant="outline" 
                onClick={retryLoading} 
                className="mt-4 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t("Retry", "重试")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col justify-center items-center h-40">
              <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t("Loading your collections...", "正在加载您的收藏...")}</p>
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
              {sortedLocations.map((location, index) => (
                <div key={location.id || `location-${index}`} className="relative group">
                  {editMode && (
                    <MiniRemoveButton onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete(location.id);
                    }}/>
                  )}
                  <PhotoLocationCard
                    location={location}
                    index={index}
                    onViewDetails={handleViewDetails}
                    showRealTimeSiqs={true}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </TooltipProvider>
      <AboutFooter />
    </div>
  );
};

export default Collections;
