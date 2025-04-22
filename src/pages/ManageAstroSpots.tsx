
import React from 'react';
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
import { Loader2 } from "lucide-react";

const ManageAstroSpots = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: spots, isLoading, refetch } = useQuery({
    queryKey: ['userAstroSpots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_astro_spots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SharedAstroSpot[];
    },
    enabled: !!user
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-50 mb-2">
            {t("My AstroSpots", "我的观星点")}
          </h1>
          <p className="text-muted-foreground">
            {t("Manage and track your favorite astronomical observation locations", "管理和追踪您最喜欢的天文观测地点")}
          </p>
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
              >
                <LocationCard
                  id={spot.id}
                  name={spot.name}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  siqs={spot.siqs}
                  timestamp={spot.created_at}
                  isCertified={false}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {t("You haven't created any AstroSpots yet.", "您还没有创建任何观星点。")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAstroSpots;

