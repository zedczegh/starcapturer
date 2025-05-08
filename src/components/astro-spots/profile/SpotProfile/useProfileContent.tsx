
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import useSpotData from '@/hooks/astro-spots/useSpotData';
import useCreatorProfile from '@/hooks/astro-spots/useCreatorProfile';
import useSpotImages from '@/hooks/astro-spots/useSpotImages';
import useProfileActions from '@/hooks/astro-spots/useProfileActions';
import useAstroSpotComments from '@/hooks/astro-spots/useAstroSpotComments';
import { ensureCommentImagesBucket } from '@/utils/comments/commentImageUtils';

export const useProfileContent = (
  spotId: string, 
  user: boolean, 
  comingFromCommunity: boolean,
  t: (key: string, fallback: string) => string
) => {
  const { user: authUser } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showInstantLoader, setShowInstantLoader] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [storageChecked, setStorageChecked] = useState(false);
  
  // Use our smaller hooks
  const { spot, isLoading, refetch } = useSpotData(spotId, refreshTrigger);
  const { creatorProfile, loadingCreator } = useCreatorProfile(spot?.user_id);
  const { spotImages, loadingImages, refetchImages } = useSpotImages(spotId, refreshTrigger);
  const { handleViewDetails, handleMessageCreator } = useProfileActions(spot);
  
  // Check if bucket exists (don't try to create it)
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const available = await ensureCommentImagesBucket();
        setStorageChecked(true);
        console.log(available ? "Comment images storage is ready" : "Comment images storage is not accessible");
      } catch (err) {
        console.error("Error checking comment image storage:", err);
        setStorageChecked(true);
      }
    };
    checkStorage();
  }, []);
  
  // Use our comment hook with improved state management
  const {
    commentSending,
    comments,
    submitComment,
    fetchComments
  } = useAstroSpotComments(spotId, t);

  // Function to trigger a refresh of all data
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Check if current user is the creator
  useEffect(() => {
    if (authUser && spot && spot.user_id === authUser.id) {
      setIsCreator(true);
    } else {
      setIsCreator(false);
    }
  }, [authUser, spot]);

  // Initial load of comments
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialComments = async () => {
      try {
        if (isMounted) {
          console.log("Loading initial comments for spot:", spotId);
          await fetchComments();
        }
      } catch (error) {
        console.error("Error loading initial comments:", error);
      }
    };
    
    if (spotId) {
      loadInitialComments();
    }
    
    return () => {
      isMounted = false;
    };
  }, [spotId, fetchComments]);

  useEffect(() => {
    if (!isLoading && !!spot) {
      setShowInstantLoader(false);
    }
  }, [isLoading, spot]);

  const handleEditClose = () => {
    setShowEditDialog(false);
    refetch();
  };

  // Handler specifically for refreshing comments
  const handleCommentsUpdate = useCallback(async () => {
    console.log("Comments update triggered");
    await fetchComments();
  }, [fetchComments]);

  // Handler for submitting a new comment
  const handleCommentSubmit = useCallback(async (
    content: string,
    imageFile: File | null,
    parentId?: string | null
  ) => {
    console.log(`Comment submission starting with image: ${!!imageFile}, parent: ${parentId || 'none'}`);
    await submitComment(content, imageFile, parentId);
  }, [submitComment]);

  // Handle images update (Gallery)
  const handleImagesUpdate = async () => {
    console.log("Images update triggered");
    await refetchImages();
    triggerRefresh();
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
    handleMessageCreator,
    storageChecked
  };
};

export default useProfileContent;
