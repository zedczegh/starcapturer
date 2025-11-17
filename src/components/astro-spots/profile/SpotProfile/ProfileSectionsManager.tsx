
import React, { useState } from 'react';
import SpotDetails from '@/components/astro-spots/profile/SpotDetails';
import TimeSlotManager from '@/components/bookings/TimeSlotManager';
import HostBookingsManager from '@/components/bookings/HostBookingsManager';
import SpotImageGallery from '@/components/astro-spots/profile/SpotImageGallery';
import SpotComments from '@/components/astro-spots/profile/SpotComments';
import SpotAbstractDisplay from '@/components/astro-spots/profile/SpotAbstractDisplay';
import LiveStreamManager from '@/components/astro-spots/profile/LiveStreamManager';
import LiveStreamViewer from '@/components/astro-spots/profile/LiveStreamViewer';

interface ProfileSectionsManagerProps {
  spotId: string;
  spot: any;
  spotImages: string[];
  loadingImages: boolean;
  user: boolean;
  isCreator: boolean;
  currentUserId?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  onImagesUpdate: () => void;
}

const ProfileSectionsManager: React.FC<ProfileSectionsManagerProps> = ({
  spotId,
  spot,
  spotImages,
  loadingImages,
  user,
  isCreator,
  currentUserId,
  verificationStatus,
  onImagesUpdate
}) => {
  const [streamRefreshKey, setStreamRefreshKey] = useState(0);
  
  const handleStreamUpdate = () => {
    setStreamRefreshKey(prev => prev + 1);
    onImagesUpdate(); // Refresh the entire spot data
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Abstract Display with SIQS and Clear Sky Rate */}
      <SpotAbstractDisplay
        latitude={spot.latitude}
        longitude={spot.longitude}
        bortleScale={spot.bortlescale}
        siqs={spot.siqs}
        spotId={spotId}
      />
      
      <SpotDetails
        description={spot.description}
        types={spot.astro_spot_types}
        advantages={spot.astro_spot_advantages}
      />
      
      {/* Live Camera Stream Section */}
      {isCreator ? (
        <LiveStreamManager
          spotId={spotId}
          currentStreamUrl={spot.camera_stream_url}
          onUpdate={handleStreamUpdate}
        />
      ) : (
        spot.camera_stream_url && (
          <LiveStreamViewer
            streamUrl={spot.camera_stream_url}
            spotName={spot.name}
          />
        )
      )}
      
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
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default ProfileSectionsManager;
