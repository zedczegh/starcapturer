
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
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  
  // Special optimization for production - check if we're coming from a direct link
  const [skipInitialRefresh] = useState(() => {
    // Check URL params to see if we should skip initial refresh
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('direct') || window.location.href.includes('direct=true');
  });
  
  // Use our smaller hooks with the refresh trigger
  const { spot, isLoading, refetch } = useSpotData(spotId, refreshTrigger);
  const { creatorProfile, loadingCreator } = useCreatorProfile(spot?.user_id);
  const { spotImages, loadingImages, refetchImages } = useSpotImages(spotId, refreshTrigger);
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

  // Function to trigger a refresh of all data with rate limiting
  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    // Limit refreshes to once every 3 seconds
    if (now - lastRefreshTime > 3000) {
      console.log("Triggering refresh for spot:", spotId);
      setRefreshTrigger(prev => prev + 1);
      setLastRefreshTime(now);
    } else {
      console.log("Refresh rate limited, ignoring request");
    }
  }, [spotId, lastRefreshTime]);
  
  // Explicit refresh function to reload all data with debouncing
  const refreshData = useCallback(async () => {
    const now = Date.now();
    // Don't allow refreshes more often than every 3 seconds
    if (now - lastRefreshTime < 3000) {
      console.log("Refresh skipped - too soon since last refresh");
      return;
    }
    
    console.log("Refreshing all spot data for ID:", spotId);
    // Increment refresh counter to trigger data reload
    setRefreshTrigger(prev => prev + 1);
    setLastRefreshTime(now);
    
    // Explicitly refetch all data
    await Promise.all([
      refetch(),
      fetchComments(),
      refetchImages()
    ]);
  }, [spotId, refetch, fetchComments, refetchImages, lastRefreshTime]);

  // Check if current user is the creator
  useEffect(() => {
    if (authUser && spot && spot.user_id === authUser.id) {
      setIsCreator(true);
    } else {
      setIsCreator(false);
    }
  }, [authUser, spot]);

  // Load initial comments only once
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
      // Skip aggressive refresh for direct navigation in production
      if (!skipInitialRefresh && isInitialLoadRef.current) {
        loadInitialComments();
        isInitialLoadRef.current = false;
      }
      
      // Set up refresh interval for comments
      const intervalId = setInterval(() => {
        if (isMounted) {
          console.log("Refreshing comments automatically");
          fetchComments();
        }
      }, 60000); // Reduce to once per minute to minimize flashing
      
      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }
  }, [spotId, fetchComments, skipInitialRefresh]);

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
    storageChecked,
    refreshData,
    triggerRefresh
  };
};

export default useProfileContent;
