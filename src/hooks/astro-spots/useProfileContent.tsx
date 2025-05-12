
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const initialLoadCompleted = useRef(false);
  
  // Use our smaller hooks with improved refresh control
  const { spot, isLoading, refetch } = useSpotData(spotId);
  const { creatorProfile, loadingCreator } = useCreatorProfile(spot?.user_id);
  const { spotImages, loadingImages, refetchImages } = useSpotImages(spotId);
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
  } = useAstroSpotComments(spotId, t);

  // Function to trigger a refresh of all data
  const triggerRefresh = useCallback(() => {
    console.log("Triggering refresh for spot:", spotId);
    setRefreshTrigger(prev => prev + 1);
  }, [spotId]);
  
  // Explicit refresh function to reload all data
  const refreshData = useCallback(async () => {
    console.log("Refreshing all spot data for ID:", spotId);
    // Increment refresh counter to trigger data reload
    setRefreshTrigger(prev => prev + 1);
    // Explicitly refetch all data
    await Promise.all([
      refetch(),
      fetchComments(),
      refetchImages()
    ]);
    
    // Creator profile refresh if needed
    if (spot?.user_id) {
      console.log("Would refresh creator profile for user ID:", spot.user_id);
    }
  }, [spotId, refetch, fetchComments, refetchImages, spot?.user_id]);

  // Check if current user is the creator - use memoization to prevent re-renders
  useEffect(() => {
    if (authUser && spot && spot.user_id === authUser.id) {
      setIsCreator(true);
    } else {
      setIsCreator(false);
    }
  }, [authUser, spot]);

  // Load initial comments once on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialComments = async () => {
      try {
        if (isMounted && spotId && !initialLoadCompleted.current) {
          console.log("Loading initial comments for spot:", spotId);
          await fetchComments();
          initialLoadCompleted.current = true;
        }
      } catch (error) {
        console.error("Error loading initial comments:", error);
      }
    };
    
    if (spotId) {
      loadInitialComments();
      
      // Set up refresh interval for comments - but less frequent
      const intervalId = setInterval(() => {
        if (isMounted && document.visibilityState === 'visible') {
          console.log("Refreshing comments automatically");
          fetchComments();
        }
      }, 60000); // Refresh every 60 seconds instead of 30
      
      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }
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
  const handleImagesUpdate = useCallback(async () => {
    console.log("Images update triggered");
    await refetchImages();
  }, [refetchImages]);

  // Memoize our return object to prevent unnecessary rerenders
  const profileContentData = useMemo(() => ({
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
  }), [
    spot, isLoading, creatorProfile, loadingCreator, isCreator,
    spotImages, loadingImages, showEditDialog, comments, commentSending,
    handleViewDetails, handleEditClose, handleCommentsUpdate,
    handleCommentSubmit, handleImagesUpdate, handleMessageCreator,
    storageChecked, refreshData, triggerRefresh
  ]);

  return profileContentData;
};

export default useProfileContent;
