
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ProfileHeaderSection from "./ProfileHeaderSection";
import ProfileSectionsManager from "./ProfileSectionsManager";
import ProfileEditButton from "./ProfileEditButton";
import { Dialog } from "@/components/ui/dialog";
import SpotDetails from "../SpotDetails";
import useProfileContents from "@/hooks/astro-spots/useProfileContents";

interface ProfileContentProps {
  spotId: string;
  user: boolean;
  comingFromCommunity?: boolean;
  noRefresh?: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  spotId,
  user,
  comingFromCommunity = false,
  noRefresh = false
}) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("overview");

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
  } = useProfileContents(spotId, user, comingFromCommunity, t, { noRefresh });

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 animate-pulse">
        <div className="h-32 bg-cosmic-800/70 rounded-md"></div>
        <div className="h-12 w-3/4 bg-cosmic-800/70 rounded-md"></div>
        <div className="h-16 bg-cosmic-800/70 rounded-md"></div>
        <div className="h-32 bg-cosmic-800/70 rounded-md"></div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-2xl text-red-400">{t("Error: AstroSpot not found", "错误：未找到天文点")}</h2>
        <p className="mt-2 text-gray-400">{t("This spot may have been removed or you don't have permission to view it.", "该天文点可能已被删除或您没有查看权限。")}</p>
      </div>
    );
  }

  return (
    <div>
      {isCreator && (
        <ProfileEditButton 
          onClick={() => setShowEditDialog(true)} 
          className="absolute top-2 right-2"
        />
      )}

      <ProfileHeaderSection
        spot={spot}
        isCreator={isCreator}
        creatorProfile={creatorProfile}
        loadingCreator={loadingCreator}
        spotImages={spotImages}
        loadingImages={loadingImages}
        onImagesUpdate={handleImagesUpdate}
        onMessageCreator={handleMessageCreator}
        comingFromCommunity={comingFromCommunity}
        onViewDetails={handleViewDetails}
      />

      <ProfileSectionsManager
        spot={spot}
        comments={comments}
        commentSending={commentSending}
        onCommentSubmit={handleCommentSubmit}
        onCommentsUpdate={handleCommentsUpdate}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        storageChecked={storageChecked}
        triggerRefresh={triggerRefresh}
      />

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        {showEditDialog && (
          <SpotDetails
            originalSpot={spot}
            onClose={handleEditClose}
            editMode={true}
          />
        )}
      </Dialog>
    </div>
  );
};

export default ProfileContent;
