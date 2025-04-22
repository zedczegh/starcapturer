
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ExternalLink, Loader2, MapPin, MessageCircle, Tag, Calendar, Star, ChevronLeft, Image } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/navigation/BackButton";

const AstroSpotProfile = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPhotosDialog, setShowPhotosDialog] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);

  // Query to fetch the astro spot data with all related information
  const { data: spot, isLoading, error } = useQuery({
    queryKey: ['astroSpot', id],
    queryFn: async () => {
      if (!id) throw new Error("No spot ID provided");
      
      console.log("Fetching astro spot with ID:", id);
      
      // First, fetch the main astro spot data
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .select('*')
        .eq('id', id)
        .single();

      if (spotError) {
        console.error("Error fetching astro spot:", spotError);
        throw spotError;
      }
      
      console.log("Fetched astro spot data:", spotData);
      
      // Then fetch the spot types separately
      const { data: typeData, error: typeError } = await supabase
        .from('astro_spot_types')
        .select('*')
        .eq('spot_id', id);
        
      if (typeError) {
        console.error("Error fetching spot types:", typeError);
      }
      
      // Fetch the advantages separately
      const { data: advantageData, error: advantageError } = await supabase
        .from('astro_spot_advantages')
        .select('*')
        .eq('spot_id', id);
        
      if (advantageError) {
        console.error("Error fetching spot advantages:", advantageError);
      }
      
      // Fetch the comments separately
      const { data: commentData, error: commentError } = await supabase
        .from('astro_spot_comments')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('spot_id', id);
        
      if (commentError) {
        console.error("Error fetching spot comments:", commentError);
        // Continue despite comment errors
      }
      
      // Build the complete spot object
      const completeSpot = {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
        astro_spot_comments: commentData || []
      };
      
      return completeSpot;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
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

  if (error) {
    console.error("Error in astro spot query:", error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              {t("Error loading AstroSpot", "加载观星点时出错")}
            </h2>
            <p className="text-gray-400 mb-4">{error.message}</p>
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

  if (!spot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              {t("AstroSpot not found", "未找到观星点")}
            </h2>
            <p className="text-gray-400 mb-4">{t("The requested AstroSpot could not be found. It may have been deleted or you may not have access to it.", "找不到请求的观星点。它可能已被删除或您可能无权访问它。")}</p>
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

  console.log("Rendering astro spot:", spot);

  // Helper function to safely get username from profiles relation
  const getUsername = (comment) => {
    if (!comment || !comment.profiles) return t("Anonymous", "匿名用户");
    // Handle both possible shapes of the data
    if (typeof comment.profiles === 'object') {
      return comment.profiles.username || t("Anonymous", "匿名用户");
    }
    return t("Anonymous", "匿名用户");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6">
        {/* Back button */}
        <BackButton 
          destination="/manage-astro-spots" 
          className="text-gray-300 mb-6 hover:bg-cosmic-800/50"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-cosmic-800/80 to-cosmic-800/40 p-6 border-b border-cosmic-700/30">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-50 flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-2 animate-pulse" />
                  {spot.name}
                </h1>
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                </div>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(spot.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <Button 
                variant="default" 
                onClick={handleViewDetails}
                className="bg-primary/80 hover:bg-primary flex items-center gap-2 rounded-full"
              >
                <ExternalLink className="h-4 w-4" />
                {t("View Location Details", "查看位置详情")}
              </Button>
            </div>
            
            {/* SIQS Score */}
            {spot.siqs && (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-cosmic-700/60 text-primary-foreground">
                <span className="font-bold mr-1">{t("SIQS", "SIQS")}:</span>
                <span 
                  className={`px-2 py-0.5 rounded-full font-mono text-sm ${
                    spot.siqs >= 8 ? 'bg-green-500/80 text-white' :
                    spot.siqs >= 6 ? 'bg-blue-500/80 text-white' :
                    spot.siqs >= 4 ? 'bg-yellow-500/80 text-white' :
                    'bg-red-500/80 text-white'
                  }`}
                >
                  {spot.siqs}
                </span>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {spot.description && (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                  <span className="w-2 h-6 bg-primary rounded-sm mr-2.5"></span>
                  {t("Description", "描述")}
                </h2>
                <p className="text-gray-300 whitespace-pre-wrap">{spot.description}</p>
              </div>
            )}
            
            {/* Location Type */}
            {spot.astro_spot_types && spot.astro_spot_types.length > 0 && (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary/80" />
                  {t("Location Type", "位置类型")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {spot.astro_spot_types.map((type) => (
                    <span 
                      key={type.id}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-700/50 to-indigo-700/50 border border-purple-600/30 text-sm text-gray-200 backdrop-blur-sm"
                    >
                      {type.type_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Advantages */}
            {spot.astro_spot_advantages && spot.astro_spot_advantages.length > 0 && (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                  <span className="w-2 h-6 bg-green-500 rounded-sm mr-2.5"></span>
                  {t("Advantages", "优势")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {spot.astro_spot_advantages.map((advantage) => (
                    <span 
                      key={advantage.id}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-green-700/50 to-teal-700/50 border border-green-600/30 text-sm text-gray-200 backdrop-blur-sm"
                    >
                      {advantage.advantage_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Comments Section */}
            {spot.astro_spot_comments && spot.astro_spot_comments.length > 0 ? (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-200 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary/80" />
                    {t("Comments", "评论")} ({spot.astro_spot_comments.length})
                  </h2>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCommentsSheet(true)}
                    className="text-sm text-primary hover:bg-cosmic-700/30"
                  >
                    {t("View All", "查看全部")}
                  </Button>
                </div>
                
                {/* Show just 2 comments in the preview */}
                <div className="space-y-3">
                  {spot.astro_spot_comments.slice(0, 2).map((comment) => (
                    <div 
                      key={comment.id}
                      className="p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-600/20"
                    >
                      <div className="flex items-center mb-2">
                        <div className="font-medium text-gray-200">
                          {getUsername(comment)}
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
            ) : (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30 flex flex-col items-center justify-center text-center">
                <MessageCircle className="h-10 w-10 text-gray-500 mb-2" />
                <p className="text-gray-400">
                  {t("No comments yet", "暂无评论")}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Comments Sheet for mobile */}
      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[85vh] bg-cosmic-900 border-cosmic-700 text-gray-100 rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-gray-100">
              {t("All Comments", "所有评论")} ({spot.astro_spot_comments?.length || 0})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-1">
            {spot.astro_spot_comments?.length > 0 ? 
              spot.astro_spot_comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-600/20"
                >
                  <div className="flex items-center mb-2">
                    <div className="font-medium text-gray-200">
                      {getUsername(comment)}
                    </div>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-gray-400">
                    {t("No comments yet", "暂无评论")}
                  </p>
                </div>
              )
            }
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AstroSpotProfile;
