import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoPointCard from "@/components/photoPoints/PhotoPointCard";
import DeleteLocationButton from "@/components/collections/DeleteLocationButton";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import useEnhancedLocation from "@/hooks/useEnhancedLocation";

const Collections = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siqsScores, setSiqsScores] = useState<Record<string, number>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});

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
        setLocations(data || []);
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
        (payload) => {
          console.log('Location deleted via real-time:', payload);
          fetchCollections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, t]);

  const handleSiqsUpdate = (locationId: string, siqs: number | null, loading: boolean) => {
    if (siqs !== null) {
      setSiqsScores(prev => ({ ...prev, [locationId]: siqs }));
    }
    setLoadingSiqs(prev => ({ ...prev, [locationId]: loading }));
  };

  const handleLocationDelete = (deletedLocationId: string) => {
    setLocations(prevLocations => 
      prevLocations.filter(location => location.id !== deletedLocationId)
    );
  };

  const LocationCard = ({ location }: { location: any }) => {
    const { locationDetails } = useEnhancedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      skip: false
    });

    let enhancedName;
    if (language === 'zh') {
      enhancedName = locationDetails?.chineseName || locationDetails?.formattedName || location.name;
    } else {
      enhancedName = locationDetails?.formattedName || location.name;
    }

    return (
      <div 
        className={`relative rounded-lg overflow-hidden ${
          location.certification || location.isdarkskyreserve 
            ? 'border-2 border-primary/50 bg-primary/5' 
            : 'border border-border'
        }`}
      >
        <PhotoPointCard
          point={{
            id: location.id,
            name: enhancedName,
            chineseName: locationDetails?.chineseName,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            bortleScale: location.bortlescale,
            siqs: siqsScores[location.id] || location.siqs,
            isDarkSkyReserve: location.isdarkskyreserve,
            certification: location.certification,
            timestamp: location.timestamp || location.created_at
          }}
          onSelect={() => {}}
          onViewDetails={() => navigate(`/location/${location.id}`)}
          userLocation={null}
        />
        <div className="absolute bottom-3 left-3">
          <DeleteLocationButton 
            locationId={location.id} 
            userId={user.id} 
            onDelete={handleLocationDelete}
          />
        </div>
        <RealTimeSiqsProvider
          isVisible={true}
          latitude={Number(location.latitude)}
          longitude={Number(location.longitude)}
          bortleScale={location.bortlescale}
          onSiqsCalculated={(siqs, loading) => handleSiqsUpdate(location.id, siqs, loading)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <TooltipProvider>
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
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Collections;
