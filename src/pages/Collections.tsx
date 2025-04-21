import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import { transformSavedLocations } from "./collections/transformLocations";
import { sortLocationsBySiqs } from "./collections/sortLocationsBySiqs";
import PageLoader from "@/components/loaders/PageLoader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";

const Collections = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          toast.error(t("Please sign in to view your collections", "请登录以查看您的收藏"));
          navigate('/photo-points');
          return;
        }
        
        setAuthChecked(true);
        fetchCollections();
      } catch (err) {
        console.error("Auth check error:", err);
        setAuthChecked(true);
        setLoading(false);
        setError(t("Authentication error", "认证错误"));
      }
    };

    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user) {
          setLocations([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('saved_locations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedLocations = transformSavedLocations(data);

        setLocations(transformedLocations);
      } catch (error: any) {
        console.error('Error fetching collections:', error);
        setError(t("Failed to load your collections", "无法加载您的收藏"));
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    if (user) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'saved_locations',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCollections();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, navigate, t]);

  const removeLocationImmediately = (locationId: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
  };

  const handleDelete = async (locationId: string) => {
    // Remove from UI immediately for snappy feel
    removeLocationImmediately(locationId);
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(t("Location removed from collection", "位置已从收藏中删除"));
    } catch (err) {
      // Add it back on error
      setLocations((prev) => {
        // TODO: Optionally keep a cache or refetch entire list here
        return prev; // For now, don't restore for simplicity
      });
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  const handleViewDetails = (location: SharedAstroSpot) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
    }
  };

  if (!authChecked) {
    return <PageLoader />;
  }

  if (!user) {
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
    <div className="min-h-screen bg-background">
      <NavBar />

      <TooltipProvider>
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
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
              {sortedLocations.map((location, index) => (
                <div key={location.id} className="relative group">
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
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Collections;
