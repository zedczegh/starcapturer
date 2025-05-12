
import React from 'react';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import { Comment } from '@/components/astro-spots/profile/types/comments';

interface ProfileSectionsManagerProps {
  spotId: string;
  spot: any;
  spotImages: string[];
  loadingImages: boolean;
  user: boolean;
  isCreator: boolean;
  comments: Comment[];
  commentSending: boolean;
  onImagesUpdate: () => void;
  onCommentsUpdate: () => void;
  onCommentSubmit: (content: string, imageFile: File | null, parentId?: string | null) => Promise<void>;
  isLoading?: boolean;
  storageChecked?: boolean;
}

const ProfileSectionsManager: React.FC<ProfileSectionsManagerProps> = ({
  spotId,
  spot,
  spotImages,
  loadingImages,
  user,
  isCreator,
  comments,
  commentSending,
  onImagesUpdate,
  onCommentsUpdate,
  onCommentSubmit,
  isLoading = false,
  storageChecked = false
}) => {
  // Don't render sections if we're still loading the spot data
  if (isLoading || !spot) {
    return (
      <div className="px-6 py-4 space-y-6">
        <div className="animate-pulse h-32 bg-cosmic-800/50 rounded-lg"></div>
        <div className="animate-pulse h-24 bg-cosmic-800/50 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Details Section */}
      <SpotDetails spot={spot} />

      {/* Image Gallery Section */}
      <SpotImageGallery
        spotId={spotId}
        spotImages={spotImages || []}
        loadingImages={loadingImages}
        isCreator={isCreator}
        onImagesUpdated={onImagesUpdate}
      />

      {/* Comments Section */}
      <SpotComments
        spotId={spotId}
        comments={comments || []}
        isCreator={isCreator}
        isLoggedIn={!!user}
        onSubmitComment={onCommentSubmit}
        onCommentsUpdated={onCommentsUpdate}
        storageInitialized={storageChecked}
        isSending={commentSending}
      />
    </div>
  );
};

export default React.memo(ProfileSectionsManager);
