
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
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
  const location = useLocation();
  const noRefresh = location.state?.noRefresh === true;
  
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
    storageChecked,
    refreshData,
    triggerRefresh
  } = useProfileContent(spotId, user, comingFromCommunity, t);

  // Force data refresh when spotId changes, but respect noRefresh flag
  useEffect(() => {
    // Skip refresh if coming from a marker popup or similar fast navigation path
    if (noRefresh) {
      console.log("ProfileContent: Skipping refresh due to noRefresh flag");
      return;
    }
    
    console.log("ProfileContent: Spot ID changed, refreshing data:", spotId);
    if (refreshData) {
      refreshData();
    }
  }, [spotId, refreshData, noRefresh]);

  if (isLoading || !spot) {
    return <LocationDetailsLoading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
        isLoading={isLoading}
        isCreator={isCreator}
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
        isLoading={isLoading}
        storageChecked={storageChecked}
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

export default React.memo(ProfileContent);
