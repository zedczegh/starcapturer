
import React, { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import ProfileHeaderSection from './ProfileHeaderSection';
import ProfileSectionsManager from './ProfileSectionsManager';
import { useProfileContent } from '@/hooks/astro-spots/useProfileContent';
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { createPortal } from 'react-dom';

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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Initialize the profile content with our custom hook
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
  } = useProfileContent(spotId, user, comingFromCommunity, t, noRefresh);
  
  // Find or create a portal container for floating UI elements
  useEffect(() => {
    const existingContainer = document.getElementById('profile-portal-container');
    if (existingContainer) {
      setPortalContainer(existingContainer);
      return;
    }
    
    const newContainer = document.createElement('div');
    newContainer.id = 'profile-portal-container';
    document.body.appendChild(newContainer);
    setPortalContainer(newContainer);
    
    return () => {
      if (newContainer && document.body.contains(newContainer)) {
        document.body.removeChild(newContainer);
      }
    };
  }, []);

  return (
    <div className="relative">
      <ProfileHeaderSection 
        spot={spot}
        isLoading={isLoading}
        creatorProfile={creatorProfile}
        loadingCreator={loadingCreator}
        isCreator={isCreator}
        onMessageCreator={handleMessageCreator}
        onViewDetails={handleViewDetails}
      />
      
      <ProfileSectionsManager
        spot={spot}
        isLoading={isLoading}
        spotImages={spotImages || []}
        loadingImages={loadingImages}
        comments={comments}
        commentSending={commentSending}
        onCommentSubmit={handleCommentSubmit}
        onCommentsUpdate={handleCommentsUpdate}
        onImagesUpdate={handleImagesUpdate}
        storageChecked={storageChecked}
      />
      
      {/* Edit Button - Only shown for creator */}
      {isCreator && !isLoading && (
        <div className="flex justify-end mt-4">
          <Button 
            onClick={() => setShowEditDialog(true)}
            variant="outline"
            className="flex items-center gap-1.5 bg-cosmic-800/70 hover:bg-cosmic-700/70 text-gray-200"
          >
            <Pencil className="h-4 w-4" />
            {t("Edit Spot", "编辑地点")}
          </Button>
        </div>
      )}
      
      {/* Edit Dialog Portal - Only render when needed */}
      {showEditDialog && portalContainer && createPortal(
        <div className="fixed inset-0 z-50 bg-cosmic-950/60 flex items-center justify-center">
          <div className="bg-cosmic-800 rounded-lg p-4 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">{t("Edit Astro Spot", "编辑观星地点")}</h2>
            {/* Form components would go here */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                {t("Cancel", "取消")}
              </Button>
              <Button onClick={handleEditClose}>
                {t("Save", "保存")}
              </Button>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </div>
  );
};

export default ProfileContent;
