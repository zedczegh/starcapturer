
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import LocationDetailsLoading from "@/components/location/LocationDetailsLoading";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import ProfileHeaderSection from './ProfileHeaderSection';
import ProfileSectionsManager from './ProfileSectionsManager';
import ProfileEditButton from './ProfileEditButton';
import VerificationBadge from '@/components/astro-spots/verification/VerificationBadge';
import VerificationButton from '@/components/astro-spots/verification/VerificationButton';
import { AdminVerificationControls } from '@/components/astro-spots/verification/AdminVerificationControls';
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
      />
      
      {/* Verification Status and Button */}
      <div className="px-6 py-4 border-b border-cosmic-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {t("Verification Status", "验证状态")}:
            </span>
            <VerificationBadge status={spot.verification_status || 'unverified'} />
          </div>
          
          <VerificationButton
            spotId={spotId}
            spotName={spot.name}
            verificationStatus={spot.verification_status || 'unverified'}
            isCreator={isCreator}
            onStatusUpdate={refreshData}
          />
        </div>
      </div>
      
      {/* Admin Verification Controls */}
      <div className="px-6 py-4">
        <AdminVerificationControls
          spotId={spotId}
          currentStatus={spot.verification_status || 'unverified'}
          onStatusUpdate={refreshData}
        />
      </div>
      
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
        verificationStatus={spot.verification_status || 'unverified'}
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
