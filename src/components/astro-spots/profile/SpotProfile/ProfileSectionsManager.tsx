
import React from 'react';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import TimeSlotManager from '@/components/bookings/TimeSlotManager';
import HostBookingsManager from '@/components/bookings/HostBookingsManager';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import SpotAbstractDisplay from '@/components/astro-spots/profile/SpotAbstractDisplay';
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
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  onImagesUpdate: () => void;
  onCommentsUpdate: () => void;
  onCommentSubmit: (content: string, images?: File[], parentId?: string | null) => Promise<void>;
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
  verificationStatus,
  onImagesUpdate,
  onCommentsUpdate,
  onCommentSubmit
}) => {
  console.log(`ProfileSectionsManager received ${comments.length} comments`);
  
  return (
    <div className="p-6 space-y-6">
      {/* Abstract Display with SIQS and Clear Sky Rate */}
      <SpotAbstractDisplay
        latitude={spot.latitude}
        longitude={spot.longitude}
        bortleScale={spot.bortlescale}
        siqs={spot.siqs}
      />
      
      <SpotDetails
        description={spot.description}
        types={spot.astro_spot_types}
        advantages={spot.astro_spot_advantages}
      />
      
      <div className="space-y-4">
        <TimeSlotManager 
          spotId={spotId} 
          isCreator={isCreator} 
          verificationStatus={verificationStatus}
        />
        
        {isCreator && (
          <div className="border-t border-cosmic-700/30 pt-4">
            <HostBookingsManager spotId={spotId} spotName={spot.name} />
          </div>
        )}
      </div>
      
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
