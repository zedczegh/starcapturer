
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsLoading from "@/components/location/LocationDetailsLoading";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import ProfileHeaderSection from './ProfileHeaderSection';
import ProfileSectionsManager from './ProfileSectionsManager';
import ProfileEditButton from './ProfileEditButton';
import useProfileContent from '@/hooks/astro-spots/useProfileContent';
import { useLocation } from 'react-router-dom';

interface ProfileContentProps {
  spotId: string;
  user: boolean;
  comingFromCommunity: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ spotId, user, comingFromCommunity }) => {
  const { t } = useLanguage();
  const location = useLocation();
  
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

  // Only force data refresh when spotId changes and not coming from a marker popup (noRefresh flag)
  useEffect(() => {
    const shouldRefresh = refreshData && !location.state?.noRefresh;
    console.log("ProfileContent: Spot ID changed, refreshData?", shouldRefresh, "noRefresh flag:", location.state?.noRefresh);
    
    if (shouldRefresh) {
      console.log("ProfileContent: Refreshing data for spot:", spotId);
      refreshData();
    }
  }, [spotId, refreshData, location.state?.noRefresh]);

  if (isLoading || !spot) {
    return <LocationDetailsLoading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} // Shorter animation for smoother transitions
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
