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
import { Loader2, Pencil } from 'lucide-react';
import { motion } from "framer-motion";
import BackButton from "@/components/navigation/BackButton";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import SpotHeader from '@/components/astro-spots/profile/SpotHeader';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import SpotImages from '@/components/astro-spots/profile/SpotImages';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import LinksFooter from '@/components/links/LinksFooter';

interface CommentProfile {
  username?: string;
  avatar_url?: string;
}

interface AstroSpotComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  spot_id: string;
  user_id: string;
  parent_id: string | null;
  profiles?: CommentProfile | null;
}

interface SpotData {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  bortlescale?: number;
  siqs?: number;
  astro_spot_types: Array<{ id: string; type_name: string }>;
  astro_spot_advantages: Array<{ id: string; advantage_name: string }>;
  astro_spot_comments: AstroSpotComment[];
}

const AstroSpotProfile = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPhotosDialog, setShowPhotosDialog] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: spot, isLoading, error, refetch } = useQuery({
    queryKey: ['astroSpot', id],
    queryFn: async () => {
      if (!id) throw new Error("No spot ID provided");
      
      console.log("Fetching astro spot with ID:", id);
      
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
      
      const { data: typeData, error: typeError } = await supabase
        .from('astro_spot_types')
        .select('*')
        .eq('spot_id', id);
        
      if (typeError) {
        console.error("Error fetching spot types:", typeError);
      }
      
      const { data: advantageData, error: advantageError } = await supabase
        .from('astro_spot_advantages')
        .select('*')
        .eq('spot_id', id);
        
      if (advantageError) {
        console.error("Error fetching spot advantages:", advantageError);
      }
      
      const { data: commentData, error: commentError } = await supabase
        .from('astro_spot_comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('spot_id', id);
        
      if (commentError) {
        console.error("Error fetching spot comments:", commentError);
        // Continue despite comment errors
      }
      
      const processedComments = (commentData || []).map((comment: any) => {
        return {
          ...comment,
          profiles: comment.profiles || { username: t("Anonymous", "匿名用户") }
        };
      });
      
      const completeSpot: SpotData = {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
        astro_spot_comments: processedComments
      };
      
      return completeSpot;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const { data: spotImages = [], isLoading: loadingImages } = useQuery({
    queryKey: ['spotImages', id],
    queryFn: async () => {
      if (!id) return [];
      
      console.log("Fetching images for spot:", id);
      
      const { data: files, error } = await supabase
        .storage
        .from('astro_spot_images')
        .list(id);
        
      if (error) {
        console.error("Error fetching spot images:", error);
        return [];
      }

      return files.map(file => {
        const { data } = supabase
          .storage
          .from('astro_spot_images')
          .getPublicUrl(`${id}/${file.name}`);
        return data.publicUrl;
      });
    },
    enabled: !!id
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

  const handleEditClose = () => {
    setShowEditDialog(false);
    refetch();
  };

  if (isLoading || !spot) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
        <BackButton 
          destination="/manage-astro-spots" 
          className="text-gray-300 mb-6 hover:bg-cosmic-800/50"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden relative"
        >
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 text-primary border-primary hover:bg-primary/10 z-10"
            onClick={() => setShowEditDialog(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t("Edit", "编辑")}
          </Button>

          {spot && <SpotHeader spot={spot} onViewDetails={handleViewDetails} />}
          
          <div className="p-6 space-y-6">
            {spot && (
              <SpotDetails 
                description={spot.description}
                types={spot.astro_spot_types}
                advantages={spot.astro_spot_advantages}
              />
            )}
            
            <SpotImages 
              images={spotImages} 
              onShowDialog={() => setShowPhotosDialog(true)} 
            />
            
            {spot && (
              <SpotComments 
                comments={spot.astro_spot_comments} 
                onShowAllComments={() => setShowCommentsSheet(true)}
              />
            )}
          </div>
        </motion.div>

        <LinksFooter />
      </div>
      
      <Dialog open={showPhotosDialog} onOpenChange={setShowPhotosDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Photo Album", "照片集")}: {spot?.name}</DialogTitle>
          </DialogHeader>
          <SpotImages 
            images={spotImages} 
            onShowDialog={() => {}} 
          />
        </DialogContent>
      </Dialog>
      
      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[85vh] bg-cosmic-900 border-cosmic-700 text-gray-100 rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-gray-100">
              {t("All Comments", "所有评论")} ({spot?.astro_spot_comments?.length || 0})
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-1">
            {spot && (
              <SpotComments 
                comments={spot.astro_spot_comments} 
                onShowAllComments={() => {}}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {showEditDialog && spot && (
        <CreateAstroSpotDialog
          latitude={spot.latitude}
          longitude={spot.longitude}
          defaultName={spot.name}
          isEditing={true}
          spotId={spot.id}
          defaultDescription={spot.description}
          trigger={<div />}
          onClose={handleEditClose}
        />
      )}
    </div>
  );
};

export default AstroSpotProfile;
