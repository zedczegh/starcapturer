import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Wrench } from 'lucide-react';
import NavBar from "@/components/NavBar";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import BackButton from "@/components/navigation/BackButton";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import SpotHeader from '@/components/astro-spots/profile/SpotHeader';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import TimeSlotManager from '@/components/bookings/TimeSlotManager';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

const AstroSpotProfile = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [showInstantLoader, setShowInstantLoader] = useState(false);

  const { data: spot, isLoading, error, refetch } = useQuery({
    queryKey: ['astroSpot', id],
    queryFn: async () => {
      if (!id) throw new Error("No spot ID provided");
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .select('*')
        .eq('id', id)
        .single();
      if (spotError) throw spotError;
      if (user && spotData.user_id === user.id) setIsCreator(true);
      else setIsCreator(false);

      const { data: typeData } = await supabase
        .from('astro_spot_types').select('*').eq('spot_id', id);
      const { data: advantageData } = await supabase
        .from('astro_spot_advantages').select('*').eq('spot_id', id);
      
      const { data: commentData } = await supabase
        .from('astro_spot_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id(
            username,
            avatar_url
          )
        `)
        .eq('spot_id', id)
        .order('created_at', { ascending: false });

      let commentsWithProfiles: Comment[] = [];
      if (commentData) {
        commentsWithProfiles = commentData.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          profiles: comment.profiles || { username: null, avatar_url: null }
        }));
      }

      return {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
        astro_spot_comments: commentsWithProfiles || [],
      };
    },
    retry: 1,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false
  });

  const { data: creatorProfile, isLoading: loadingCreator } = useQuery({
    queryKey: ['creatorProfile', spot?.user_id],
    queryFn: async () => {
      if (!spot?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', spot.user_id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching creator profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!spot?.user_id
  });

  const { data: spotImages = [], isLoading: loadingImages, refetch: refetchImages } = useQuery({
    queryKey: ['spotImages', id],
    queryFn: async () => {
      if (!id) return [];
      
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const astroBucketExists = buckets?.some(bucket => bucket.name === 'astro_spot_images');
        
        if (!astroBucketExists) {
          console.log("Astro spot images bucket doesn't exist yet");
          return [];
        }
        
        const { data: files, error } = await supabase
          .storage
          .from('astro_spot_images')
          .list(id);
          
        if (error) {
          console.error("Error listing files:", error);
          return [];
        }
        
        if (!files || files.length === 0) {
          return [];
        }
        
        return files.map(file => {
          const { data } = supabase
            .storage
            .from('astro_spot_images')
            .getPublicUrl(`${id}/${file.name}`);
          return data.publicUrl;
        });
      } catch (error) {
        console.error("Error fetching spot images:", error);
        return [];
      }
    },
    enabled: !!id
  });

  useEffect(() => {
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
      setShowInstantLoader(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isLoading && !!spot) {
      setShowInstantLoader(false);
    }
  }, [isLoading, spot]);

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
    return <div className="min-h-screen flex items-center justify-center bg-cosmic-900">{t("Loading...", "加载中...")}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
        <BackButton
          destination={comingFromCommunity ? "/community" : "/manage-astro-spots"}
          className="text-gray-300 mb-6 hover:bg-cosmic-800/50"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden relative"
        >
          {isCreator && !comingFromCommunity && (
            <Button
              variant="default"
              size="icon"
              className="absolute -top-2 -left-2 z-10 bg-primary/20 hover:bg-primary/30 text-white rounded-full w-12 h-12 shadow-lg border border-cosmic-700/30"
              onClick={() => setShowEditDialog(true)}
            >
              <Wrench className="h-6 w-6" />
            </Button>
          )}

          <SpotHeader
            spot={spot}
            creatorProfile={creatorProfile}
            loadingCreator={loadingCreator}
            spotId={spot.user_id}
            onViewDetails={handleViewDetails}
          />
          
          <div className="p-6 space-y-6">
            <SpotDetails
              description={spot.description}
              types={spot.astro_spot_types}
              advantages={spot.astro_spot_advantages}
            />
            
            <TimeSlotManager spotId={id!} isCreator={isCreator} />
            
            <SpotImageGallery
              spotId={id!}
              spotName={spot.name}
              spotImages={spotImages}
              loadingImages={loadingImages}
              user={!!user}
              onImagesUpdate={refetchImages}
            />
            
            <SpotComments
              spotId={id!}
              comments={spot.astro_spot_comments || []}
              user={!!user}
              onCommentsUpdate={refetch}
            />
          </div>
        </motion.div>
      </div>

      {showEditDialog && spot && isCreator && (
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

      <footer className="mt-auto py-8 bg-cosmic-900/60 border-t border-cosmic-800/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-gray-200">
                {t("AstroSIQS", "天文SIQS")}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
              <Link to="/photo-points" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("Photo Points", "拍摄点")}
              </Link>
              <Link to="/share" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("Bortle Now", "实时光污染")}
              </Link>
              <Link to="/useful-links" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("Resources", "资源")}
              </Link>
              <Link to="/about" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("About SIQS", "关于SIQS")}
              </Link>
            </div>
            <div className="text-sm text-gray-500 mt-4 md:mt-0">
              &copy; {new Date().getFullYear()} AstroSIQS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AstroSpotProfile;
