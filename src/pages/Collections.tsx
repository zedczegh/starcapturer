
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";

const Collections = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/photo-points');
      toast.error(t("Please sign in to view your collections", "请登录以查看您的收藏"));
      return;
    }

    const fetchCollections = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('saved_locations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedLocations: SharedAstroSpot[] = (data || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          chineseName: null, // Since chinese_name doesn't exist in the table, initialize as null
          latitude: loc.latitude,
          longitude: loc.longitude,
          bortleScale: loc.bortlescale,
          siqs: loc.siqs,
          certification: loc.certification || null,
          isDarkSkyReserve: loc.isdarkskyreserve || false,
          timestamp: loc.timestamp || new Date().toISOString(),
        }));

        setLocations(transformedLocations);
      } catch (error: any) {
        console.error('Error fetching collections:', error);
        toast.error(t("Failed to load your collections", "无法加载您的收藏"));
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();

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
  }, [user, navigate, t]);

  const handleViewDetails = (location: SharedAstroSpot) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      toast.success(t("Location removed from collection", "位置已从收藏中删除"));
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(t("Failed to delete location", "删除位置失败"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <TooltipProvider>
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("My Collections", "我的收藏")}
            </h1>
            {locations.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
                className="text-primary hover:text-primary-focus"
              >
                {isEditing ? t("Done", "完成") : t("Edit", "编辑")}
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : locations.length === 0 ? (
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
              {locations.map((location, index) => (
                <div key={location.id} className="relative group">
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="absolute -top-2 -left-2 z-30 bg-destructive hover:bg-destructive/90 rounded-full p-1.5 transition-all duration-200 shadow-lg"
                    >
                      <Minus className="h-4 w-4 text-white" />
                    </button>
                  )}
                  <div className={isEditing ? "opacity-80" : ""}>
                    <PhotoLocationCard
                      location={location}
                      index={index}
                      onViewDetails={handleViewDetails}
                      showRealTimeSiqs={true}
                      forceRealTimeSiqs={true}
                    />
                  </div>
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
