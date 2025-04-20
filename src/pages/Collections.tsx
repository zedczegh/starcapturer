
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoPointCard from "@/components/photoPoints/PhotoPointCard";

const Collections = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if user is not authenticated
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
        setLocations(data || []);
      } catch (error: any) {
        console.error('Error fetching collections:', error);
        toast.error(t("Failed to load your collections", "无法加载您的收藏"));
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user, navigate, t]);

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
        <h1 className="text-2xl font-bold mb-6">{t("My Collections", "我的收藏")}</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12">
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
            {locations.map((location) => (
              <PhotoPointCard
                key={location.id}
                point={{
                  id: location.id,
                  name: location.name,
                  latitude: Number(location.latitude),
                  longitude: Number(location.longitude),
                  bortleScale: location.bortlescale,
                  siqs: location.siqs,
                  isDarkSkyReserve: location.isdarkskyreserve,
                  certification: location.certification,
                  timestamp: location.timestamp || location.created_at // Add the missing timestamp property
                }}
                onSelect={() => {}}
                onViewDetails={() => navigate(`/location/${location.id}`)}
                userLocation={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
