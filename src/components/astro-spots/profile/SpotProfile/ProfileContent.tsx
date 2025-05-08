
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import SpotHeader from '@/components/astro-spots/profile/SpotHeader';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import TimeSlotManager from '@/components/bookings/TimeSlotManager';
import LocationDetailsLoading from "@/components/location/LocationDetailsLoading";
import { Comment } from '../types/comments';

interface ProfileContentProps {
  spotId: string;
  user: boolean;
  comingFromCommunity: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ spotId, user, comingFromCommunity }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showInstantLoader, setShowInstantLoader] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const { data: spot, isLoading, error, refetch } = useQuery({
    queryKey: ['astroSpot', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) throw new Error("No spot ID provided");
      
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .select('*')
        .eq('id', spotId)
        .single();
        
      if (spotError) throw spotError;
      
      if (authUser && spotData.user_id === authUser.id) setIsCreator(true);
      else setIsCreator(false);

      const { data: typeData } = await supabase
        .from('astro_spot_types').select('*').eq('spot_id', spotId);
        
      const { data: advantageData } = await supabase
        .from('astro_spot_advantages').select('*').eq('spot_id', spotId);
      
      const { data: commentData, error: commentError } = await supabase
        .from('astro_spot_comments')
        .select(`
          id,
          content,
          created_at,
          image_url,
          profiles:profiles!user_id(
            username,
            avatar_url
          )
        `)
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false });

      if (commentError) {
        console.error("Error fetching comments:", commentError);
      }
      
      let commentsWithProfiles: Comment[] = [];
      if (commentData) {
        commentsWithProfiles = commentData.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          image_url: comment.image_url,
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
    staleTime: 1000 * 15,
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
    queryKey: ['spotImages', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) return [];
      
      try {
        console.log("Fetching images for spot:", spotId);
        
        const { data: files, error } = await supabase
          .storage
          .from('astro_spot_images')
          .list(spotId);
          
        if (error) {
          console.error("Error listing files:", error);
          return [];
        }
        
        if (!files || files.length === 0) {
          console.log("No images found for spot:", spotId);
          return [];
        }
        
        console.log("Found", files.length, "images for spot:", spotId);
        
        return files.map(file => {
          const { data } = supabase
            .storage
            .from('astro_spot_images')
            .getPublicUrl(`${spotId}/${file.name}`);
          return data.publicUrl;
        });
      } catch (error) {
        console.error("Error fetching spot images:", error);
        return [];
      }
    },
    enabled: !!spotId,
    staleTime: 1000 * 15
  });

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

  const handleCommentsUpdate = async () => {
    console.log("Comments update triggered");
    await refetch();
  };

  const handleImagesUpdate = async () => {
    console.log("Images update triggered");
    await refetchImages();
    triggerRefresh();
  };

  const handleMessageCreator = () => {
    if (!authUser || !spot?.user_id) return;
    navigate('/messages', { state: { selectedUser: spot.user_id } });
  };

  if (isLoading || !spot) {
    return <LocationDetailsLoading />;
  }

  return (
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
        comingFromCommunity={comingFromCommunity}
      />
      
      <div className="p-6 space-y-6">
        <SpotDetails
          description={spot.description}
          types={spot.astro_spot_types}
          advantages={spot.astro_spot_advantages}
        />
        
        <TimeSlotManager spotId={spotId} isCreator={isCreator} />
        
        <SpotImageGallery
          spotId={spotId}
          spotName={spot.name}
          spotImages={spotImages}
          loadingImages={loadingImages}
          user={user}
          isCreator={isCreator}
          onImagesUpdate={handleImagesUpdate}
        />
        
        <SpotComments
          spotId={spotId}
          comments={spot.astro_spot_comments || []}
          user={user}
          onCommentsUpdate={handleCommentsUpdate}
        />
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
    </motion.div>
  );
};

export default ProfileContent;
