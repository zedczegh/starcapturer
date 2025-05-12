
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
  t: (key: string, fallback: string) => string,
  noRefresh: boolean = false
) => {
  const { user: authUser } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showInstantLoader, setShowInstantLoader] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [storageChecked, setStorageChecked] = useState(false);
  
  // Use our smaller hooks with the refresh trigger
  const { spot, isLoading, refetch } = useSpotData(spotId, refreshTrigger, noRefresh);
  const { creatorProfile, loadingCreator } = useCreatorProfile(spot?.user_id, noRefresh);
  const { spotImages, loadingImages, refetchImages } = useSpotImages(spotId, refreshTrigger, noRefresh);
  const { handleViewDetails, handleMessageCreator } = useProfileActions(spot);
  
  // Check if bucket exists but don't try to create it
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const available = await ensureCommentImagesBucket();
        setStorageChecked(true);
        if (!available) {
          console.log("Comment images storage is not accessible - this will affect image uploads");
        }
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
  } = useAstroSpotComments(spotId, t, noRefresh);

  // Function to trigger a refresh of all data
  const triggerRefresh = useCallback(() => {
    if (noRefresh) {
      console.log("Skipping refresh as noRefresh flag is set");
      return;
    }
    
    console.log("Triggering refresh for spot:", spotId);
    setRefreshTrigger(prev => prev + 1);
  }, [spotId, noRefresh]);
  
  // Explicit refresh function to reload all data
  const refreshData = useCallback(async () => {
    if (noRefresh) {
      console.log("Skipping refresh as noRefresh flag is set");
      return;
    }
    
    console.log("Refreshing all spot data for ID:", spotId);
    // Increment refresh counter to trigger data reload
    setRefreshTrigger(prev => prev + 1);
    // Explicitly refetch all data
    await Promise.all([
      refetch(),
      fetchComments(),
      refetchImages()
    ]);
  }, [spotId, refetch, fetchComments, refetchImages, noRefresh]);

  // Check if current user is the creator
  useEffect(() => {
    if (authUser && spot && spot.user_id === authUser.id) {
      setIsCreator(true);
    } else {
      setIsCreator(false);
    }
  }, [authUser, spot]);

  // Load initial comments and set up refresh interval
  useEffect(() => {
    if (noRefresh) {
      console.log("Skipping comments auto-refresh as noRefresh flag is set");
      return;
    }
    
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
      
      // Set up refresh interval for comments
      const intervalId = setInterval(() => {
        if (isMounted) {
          console.log("Refreshing comments automatically");
          fetchComments();
        }
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }
  }, [spotId, fetchComments, noRefresh]);

  useEffect(() => {
    if (!isLoading && !!spot) {
      setShowInstantLoader(false);
    }
  }, [isLoading, spot]);

  const handleEditClose = () => {
    setShowEditDialog(false);
    if (!noRefresh) refetch();
  };

  // Handler specifically for refreshing comments
  const handleCommentsUpdate = useCallback(async () => {
    console.log("Comments update triggered");
    if (!noRefresh) await fetchComments();
  }, [fetchComments, noRefresh]);

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
    if (noRefresh) return;
    
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
    storageChecked,
    refreshData,
    triggerRefresh
  };
};

export default useProfileContent;
