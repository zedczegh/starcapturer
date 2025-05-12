
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import SpotHeader from '@/components/astro-spots/profile/SpotHeader';

interface ProfileHeaderSectionProps {
  spot: any;
  creatorProfile: any;
  loadingCreator: boolean;
  onViewDetails: () => void;
  comingFromCommunity: boolean;
  onMessageCreator: () => void;
}

const ProfileHeaderSection: React.FC<ProfileHeaderSectionProps> = ({
  spot,
  creatorProfile,
  loadingCreator,
  onViewDetails,
  comingFromCommunity,
  onMessageCreator
}) => {
  const navigate = useNavigate();

  // Ensure we have a valid creator profile before trying to render the header
  if (!spot) {
    return <div className="animate-pulse h-32 bg-cosmic-800/50 rounded-lg mb-6"></div>;
  }

  return (
    <SpotHeader
      spot={spot}
      creatorProfile={creatorProfile}
      loadingCreator={loadingCreator}
      spotId={spot.id}
      onViewDetails={onViewDetails}
      comingFromCommunity={comingFromCommunity}
      onMessageCreator={onMessageCreator}
    />
  );
};

export default ProfileHeaderSection;
