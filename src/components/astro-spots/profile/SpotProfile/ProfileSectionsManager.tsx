
import React from 'react';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import TimeSlotManager from '@/components/bookings/TimeSlotManager';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import { Comment } from '../types/comments';

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
  onCommentSubmit: (content: string, imageFile: File | null) => Promise<void>;
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
  onCommentSubmit
}) => {
  return (
    <div className="p-6 space-y-6">
      <SpotDetails
        description={spot.description}
        types={spot.astro_spot_types}
        advantages={spot.astro_spot_advantages}
      />
      
      <TimeSlotManager spotId={spotId} isCreator={isCreator} />
      
      <SpotImageGallery
        spotId={spotId}
        spotName={spot.name}
        spotImages={spotImages}
        loadingImages={loadingImages}
        user={user}
        isCreator={isCreator}
        onImagesUpdate={onImagesUpdate}
      />
      
      <SpotComments
        spotId={spotId}
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
