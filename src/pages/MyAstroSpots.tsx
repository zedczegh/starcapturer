
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';

interface AstroSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  types?: string[];
  advantages?: string[];
}

const MyAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [spots, setSpots] = useState<AstroSpot[]>([]);

  useEffect(() => {
    if (!user) {
      toast.error(t("Authentication required", "需要认证"));
      navigate('/photo-points');
      return;
    }

    const fetchAstroSpots = async () => {
      try {
        setLoading(true);
        // Fetch user's astro spots
        const { data: spotsData, error: spotsError } = await supabase
          .from('user_astro_spots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (spotsError) throw spotsError;

        if (spotsData && spotsData.length > 0) {
          // Fetch associated types and advantages for each spot
          const spotsWithDetails = await Promise.all(
            spotsData.map(async (spot) => {
              // Fetch types
              const { data: typesData } = await supabase
                .from('astro_spot_types')
                .select('type_name')
                .eq('spot_id', spot.id);

              // Fetch advantages
              const { data: advantagesData } = await supabase
                .from('astro_spot_advantages')
                .select('advantage_name')
                .eq('spot_id', spot.id);

              return {
                ...spot,
                types: typesData?.map(t => t.type_name) || [],
                advantages: advantagesData?.map(a => a.advantage_name) || []
              };
            })
          );

          setSpots(spotsWithDetails);
        } else {
          setSpots([]);
        }
      } catch (error) {
        console.error('Error fetching astro spots:', error);
        toast.error(t("Failed to fetch astro spots", "获取观星点失败"));
      } finally {
        setLoading(false);
      }
    };

    fetchAstroSpots();
  }, [user, navigate, t]);

  const handleViewSpot = (latitude: number, longitude: number) => {
    navigate('/photo-points', { state: { latitude, longitude } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">{t("My Astro Spots", "我的观星点")}</h1>
          <Button 
            onClick={() => navigate('/create-astro-spot')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("Add New", "添加新的")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : spots.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <MapPin className="h-12 w-12 text-cosmic-400" />
              <h2 className="text-xl font-semibold">{t("No Astro Spots Yet", "暂无观星点")}</h2>
              <p className="text-cosmic-400 max-w-md mx-auto">
                {t("You haven't created any astro spots yet. Add your favorite observation locations to share with the community.", "您尚未创建任何观星点。添加您最喜欢的观察位置，与社区分享。")}
              </p>
              <Button 
                onClick={() => navigate('/create-astro-spot')}
                className="mt-4"
              >
                {t("Create Your First Astro Spot", "创建您的第一个观星点")}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
              <Card key={spot.id} className="overflow-hidden bg-cosmic-900/50 border-cosmic-700">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{spot.name}</h3>
                  
                  {spot.types && spot.types.length > 0 && (
                    <div className="mb-4">
                      <p className="text-cosmic-400 text-sm mb-1">{t("Location Type", "位置类型")}:</p>
                      <div className="flex flex-wrap gap-2">
                        {spot.types.map((type, index) => (
                          <span key={index} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                            {t(type, type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {spot.description && (
                    <p className="text-cosmic-300 text-sm mb-4 line-clamp-3">{spot.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-cosmic-400">
                      {new Date(spot.created_at).toLocaleDateString()}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewSpot(spot.latitude, spot.longitude)}
                    >
                      {t("View Location", "查看位置")}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyAstroSpots;
