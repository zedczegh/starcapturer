
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import SpotHeader from '@/components/astro-spots/profile/SpotHeader';

interface ProfileHeaderSectionProps {
  spot: any;
  isLoading: boolean;
  creatorProfile: any;
  loadingCreator: boolean;
  onViewDetails: () => void;
  onMessageCreator: () => void;
  comingFromCommunity?: boolean;
}

const ProfileHeaderSection: React.FC<ProfileHeaderSectionProps> = ({
  spot,
  isLoading,
  creatorProfile,
  loadingCreator,
  onViewDetails,
  comingFromCommunity = false,
  onMessageCreator
}) => {
  const navigate = useNavigate();

  // Ensure we have a valid creator profile before trying to render the header
  if (!spot || isLoading) {
    return <div className="animate-pulse h-32 bg-cosmic-800/50 rounded-lg mb-6"></div>;
  }

  // Enhanced onMessageCreator handler with better error handling
  const handleMessageCreator = () => {
    if (!spot.user_id) {
      console.error("Cannot message creator: Missing user ID");
      return;
    }
    
    if (onMessageCreator) {
      onMessageCreator();
    } else {
      // Fallback direct navigation with improved state
      navigate('/messages', { 
        state: { 
          selectedUserId: spot.user_id,
          selectedUsername: creatorProfile?.username || "Creator",
          timestamp: Date.now() // Ensure message UI refreshes
        }
      });
    }
  };

  return (
    <SpotHeader
      spot={spot}
      creatorProfile={creatorProfile}
      loadingCreator={loadingCreator}
      spotId={spot.id}
      onViewDetails={onViewDetails}
      comingFromCommunity={comingFromCommunity}
      onMessageCreator={handleMessageCreator}
    />
  );
};

export default ProfileHeaderSection;
