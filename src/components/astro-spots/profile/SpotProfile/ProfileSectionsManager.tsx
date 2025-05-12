
import React from 'react';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import TimeSlotManager from '@/components/bookings/TimeSlotManager';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import { Comment } from '../types/comments';

interface ProfileSectionsManagerProps {
  spotId?: string;
  spot: any;
  isLoading: boolean;
  spotImages: string[];
  loadingImages: boolean;
  user?: boolean;
  isCreator?: boolean;
  comments: Comment[];
  commentSending: boolean;
  onImagesUpdate: () => void;
  onCommentsUpdate: () => void;
  onCommentSubmit: (content: string, imageFile: File | null, parentId?: string | null) => Promise<void>;
  storageChecked?: boolean;
}

const ProfileSectionsManager: React.FC<ProfileSectionsManagerProps> = ({
  spotId,
  spot,
  isLoading,
  spotImages,
  loadingImages,
  user = false,
  isCreator = false,
  comments,
  commentSending,
  onImagesUpdate,
  onCommentsUpdate,
  onCommentSubmit,
  storageChecked
}) => {
  if (isLoading || !spot) {
    return <div className="p-6 space-y-6 animate-pulse">
      <div className="h-24 bg-cosmic-800/30 rounded-lg mb-4"></div>
      <div className="h-32 bg-cosmic-800/20 rounded-lg"></div>
    </div>;
  }
  
  console.log(`ProfileSectionsManager received ${comments?.length || 0} comments`);
  
  return (
    <div className="p-6 space-y-6">
      <SpotDetails
        description={spot.description}
        types={spot.astro_spot_types}
        advantages={spot.astro_spot_advantages}
      />
      
      {spotId && <TimeSlotManager spotId={spotId} isCreator={isCreator} />}
      
      <SpotImageGallery
        spotId={spot.id}
        spotName={spot.name}
        spotImages={spotImages}
        loadingImages={loadingImages}
        user={user}
        isCreator={isCreator}
        onImagesUpdate={onImagesUpdate}
      />
      
      <SpotComments
        spotId={spot.id}
        comments={comments}
        user={user}
        onCommentsUpdate={onCommentsUpdate}
        onSubmit={onCommentSubmit}
        sending={commentSending}
      />
    </div>
  );
};

export default ProfileSectionsManager;
