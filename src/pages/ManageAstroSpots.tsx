
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import LocationCard from "@/components/LocationCard";
import { SharedAstroSpot } from "@/types/weather";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";
import { Button } from "@/components/ui/button";

const ManageAstroSpots = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});

  const { data: spots, isLoading, refetch } = useQuery({
    queryKey: ['userAstroSpots'],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Fetching user astro spots");
      
      const { data, error } = await supabase
        .from('user_astro_spots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching astro spots:", error);
        throw error;
      }
      
      console.log("Fetched astro spots:", data);
      
      // Transform the data to match the SharedAstroSpot interface
      return data.map(spot => ({
        id: spot.id,
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
        bortleScale: spot.bortlescale || 4,
        description: spot.description,
        siqs: spot.siqs,
        timestamp: spot.created_at,
        user_id: spot.user_id
      })) as SharedAstroSpot[];
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const handleDelete = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .delete()
        .eq('id', spotId);
      
      if (error) throw error;
      
      toast.success(t("AstroSpot deleted successfully", "观星点删除成功"));
      refetch();
    } catch (error) {
      console.error('Error deleting astro spot:', error);
      toast.error(t("Failed to delete AstroSpot", "删除观星点失败"));
    }
  };
  
  const handleSiqsCalculated = (spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
  };

  const handleSpotClick = (spotId: string) => {
    if (!editMode) {
      console.log("Navigating to astro spot profile:", spotId);
      navigate(`/astro-spot/${spotId}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-8">
          <p className="text-muted-foreground">
            {t("Please sign in to manage your AstroSpots", "请登录以管理您的观星点")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-50 mb-2">
              {t("My AstroSpots", "我的观星点")}
            </h1>
            <p className="text-muted-foreground">
              {t("Manage and track your favorite astronomical observation locations", "管理和追踪您最喜欢的天文观测地点")}
            </p>
          </div>
          
          {spots && spots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="text-primary border-primary hover:bg-primary/10"
            >
              {editMode ? t("Done", "完成") : t("Edit", "编辑")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          </div>
        ) : spots && spots.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot, index) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
                onClick={() => handleSpotClick(spot.id)}
              >
                {editMode && (
                  <MiniRemoveButton onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(spot.id);
                  }} />
                )}
                
                <RealTimeSiqsProvider
                  isVisible={true}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  bortleScale={spot.bortleScale}
                  existingSiqs={spot.siqs}
                  onSiqsCalculated={(siqs, loading) => handleSiqsCalculated(spot.id, siqs, loading)}
                />
                
                <div className={`cursor-${editMode ? 'default' : 'pointer'}`}>
                  <LocationCard
                    id={spot.id}
                    name={spot.name}
                    latitude={spot.latitude}
                    longitude={spot.longitude}
                    siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
                    timestamp={spot.timestamp}
                    isCertified={false}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-lg bg-cosmic-800/30 border border-cosmic-700/30">
            <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {t("You haven't created any AstroSpots yet.", "您还没有创建任何观星点。")}
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/photo-points')}
              className="mt-2"
            >
              {t("Create Your First AstroSpot", "创建您的第一个观星点")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAstroSpots;
