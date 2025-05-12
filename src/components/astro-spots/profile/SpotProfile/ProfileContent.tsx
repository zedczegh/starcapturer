
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import LocationDetailsLoading from "@/components/location/LocationDetailsLoading";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import ProfileHeaderSection from './ProfileHeaderSection';
import ProfileSectionsManager from './ProfileSectionsManager';
import ProfileEditButton from './ProfileEditButton';
import useProfileContent from '@/hooks/astro-spots/useProfileContent';

interface ProfileContentProps {
  spotId: string;
  user: boolean;
  comingFromCommunity: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ spotId, user, comingFromCommunity }) => {
  const { t } = useLanguage();
  
  const {
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
    refreshData,
    triggerRefresh
  } = useProfileContent(spotId, user, comingFromCommunity, t);

  // Force data refresh when spotId changes
  useEffect(() => {
    console.log("ProfileContent: Spot ID changed, refreshing data:", spotId);
    // Check if refreshData exists and only call if it does
    if (refreshData && typeof refreshData === 'function') {
      refreshData();
    }
  }, [spotId, refreshData]);

  // Handle sharing the profile link
  const handleShareProfile = () => {
    const profileUrl = window.location.href;
    
    // Try to use the more modern navigator.clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          // Fallback for clipboard API failures (e.g., not secure context)
          fallbackCopyToClipboard(profileUrl);
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      fallbackCopyToClipboard(profileUrl);
    }
  };
  
  // Fallback copy method using a temporary input element
  const fallbackCopyToClipboard = (text: string) => {
    try {
      const tempInput = document.createElement("input");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-9999px";
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast.error(t("Could not copy link, please copy it manually", "无法复制链接，请手动复制"));
    }
  };

  // Show loading state if data is not yet available
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
      <ProfileEditButton 
        isCreator={isCreator} 
        comingFromCommunity={comingFromCommunity}
        onClick={() => setShowEditDialog(true)} 
      />

      <ProfileHeaderSection
        spot={spot}
        creatorProfile={creatorProfile}
        loadingCreator={loadingCreator}
        onViewDetails={handleViewDetails}
        comingFromCommunity={comingFromCommunity}
        onMessageCreator={handleMessageCreator}
        onShareProfile={handleShareProfile}
      />
      
      <ProfileSectionsManager
        spotId={spotId}
        spot={spot}
        spotImages={spotImages}
        loadingImages={loadingImages}
        user={user}
        isCreator={isCreator}
        comments={comments}
        commentSending={commentSending}
        onImagesUpdate={handleImagesUpdate}
        onCommentsUpdate={handleCommentsUpdate}
        onCommentSubmit={handleCommentSubmit}
      />

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
