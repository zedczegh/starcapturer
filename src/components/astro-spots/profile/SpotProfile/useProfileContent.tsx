
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Comment } from '../types/comments';
import useAstroSpotComments from '@/hooks/astro-spots/useAstroSpotComments';

export const useProfileContent = (
  spotId: string, 
  user: boolean, 
  comingFromCommunity: boolean,
  t: (key: string, fallback: string) => string
) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showInstantLoader, setShowInstantLoader] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Use our comment hook
  const {
    commentSending,
    submitComment,
    fetchComments
  } = useAstroSpotComments(spotId, t);

  // Function to trigger a refresh of all data
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Load initial comments and set up refresh interval
  useEffect(() => {
    let isMounted = true;
    
    const loadComments = async () => {
      try {
        console.log("Loading comments for spot:", spotId);
        const fetchedComments = await fetchComments();
        if (isMounted) {
          setComments(fetchedComments);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };
    
    if (spotId) {
      loadComments();
      
      // Set up refresh interval for comments
      const intervalId = setInterval(() => {
        if (isMounted) loadComments();
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }
  }, [spotId, refreshTrigger, fetchComments]);

  // Main spot data query
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
      
      return {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
      };
    },
    retry: 1,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false
  });

  // Creator profile query
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

  // Spot images query
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

  // Handler specifically for refreshing comments
  const handleCommentsUpdate = async () => {
    console.log("Comments update triggered");
    try {
      const updatedComments = await fetchComments();
      console.log("Fresh comments fetched:", updatedComments.length);
      setComments(updatedComments);
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  };

  // Handler for submitting a new comment
  const handleCommentSubmit = async (content: string, imageFile: File | null) => {
    console.log("Comment submission starting with image:", !!imageFile);
    const result = await submitComment(content, imageFile);
    if (result.success && result.comments) {
      console.log("Comment posted successfully, updating list with", result.comments.length, "comments");
      setComments(result.comments);
    } else {
      console.log("Comment submission failed, refreshing list anyway");
      handleCommentsUpdate(); // Try to refresh anyway
    }
  };

  // Handle images update (Gallery)
  const handleImagesUpdate = async () => {
    console.log("Images update triggered");
    await refetchImages();
    triggerRefresh();
  };

  const handleMessageCreator = () => {
    if (!authUser || !spot?.user_id) return;
    navigate('/messages', { state: { selectedUser: spot.user_id } });
  };

  return {
    spot,
    isLoading,
    creatorProfile,
    loadingCreator,
    isCreator,
    spotImages,
    loadingImages,
    showEditDialog,
    setShowEditDialog,
    comments,
    commentSending,
    handleViewDetails,
    handleEditClose,
    handleCommentsUpdate,
    handleCommentSubmit,
    handleImagesUpdate,
    handleMessageCreator
  };
};

export default useProfileContent;
