
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const AstroSpotProfile = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: spot, isLoading } = useQuery({
    queryKey: ['astroSpot', id],
    queryFn: async () => {
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .select(`
          *,
          astro_spot_types (type_name),
          astro_spot_advantages (advantage_name),
          astro_spot_comments (
            id,
            content,
            created_at,
            user_id,
            profiles (username, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (spotError) throw spotError;
      return spotData;
    }
  });

  const handleViewDetails = () => {
    if (spot) {
      navigate(`/location/${spot.latitude},${spot.longitude}`, {
        state: {
          latitude: spot.latitude,
          longitude: spot.longitude,
          name: spot.name,
          bortleScale: spot.bortlescale,
          siqs: spot.siqs
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              {t("AstroSpot not found", "未找到观星点")}
            </h2>
            <Button 
              variant="outline" 
              onClick={() => navigate('/manage-astro-spots')}
              className="mt-4"
            >
              {t("Back to My AstroSpots", "返回我的观星点")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container py-8 px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-50 mb-2">{spot.name}</h1>
              <div className="flex items-center text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleViewDetails}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t("View Location Details", "查看位置详情")}
            </Button>
          </div>

          {spot.description && (
            <div className="bg-cosmic-800/30 rounded-lg p-6 mb-6 border border-cosmic-700/30">
              <h2 className="text-xl font-semibold text-gray-200 mb-3">
                {t("Description", "描述")}
              </h2>
              <p className="text-gray-300 whitespace-pre-wrap">{spot.description}</p>
            </div>
          )}

          {spot.astro_spot_types && spot.astro_spot_types.length > 0 && (
            <div className="bg-cosmic-800/30 rounded-lg p-6 mb-6 border border-cosmic-700/30">
              <h2 className="text-xl font-semibold text-gray-200 mb-3">
                {t("Location Type", "位置类型")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {spot.astro_spot_types.map((type: { type_name: string }, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full bg-cosmic-700/50 text-sm text-gray-200"
                  >
                    {type.type_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {spot.astro_spot_advantages && spot.astro_spot_advantages.length > 0 && (
            <div className="bg-cosmic-800/30 rounded-lg p-6 mb-6 border border-cosmic-700/30">
              <h2 className="text-xl font-semibold text-gray-200 mb-3">
                {t("Advantages", "优势")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {spot.astro_spot_advantages.map((advantage: { advantage_name: string }, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full bg-cosmic-700/50 text-sm text-gray-200"
                  >
                    {advantage.advantage_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {spot.astro_spot_comments && spot.astro_spot_comments.length > 0 && (
            <div className="bg-cosmic-800/30 rounded-lg p-6 border border-cosmic-700/30">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">
                {t("Comments", "评论")}
              </h2>
              <div className="space-y-4">
                {spot.astro_spot_comments.map((comment: any) => (
                  <div 
                    key={comment.id}
                    className="p-4 bg-cosmic-800/20 rounded-lg border border-cosmic-600/20"
                  >
                    <div className="flex items-center mb-2">
                      <div className="font-medium text-gray-200">
                        {comment.profiles?.username || t("Anonymous", "匿名用户")}
                      </div>
                      <span className="text-gray-500 text-sm ml-2">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AstroSpotProfile;
