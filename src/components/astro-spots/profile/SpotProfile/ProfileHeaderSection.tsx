
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
  return (
    <SpotHeader
      spot={spot}
      creatorProfile={creatorProfile}
      loadingCreator={loadingCreator}
      spotId={spot.user_id}
      onViewDetails={onViewDetails}
      comingFromCommunity={comingFromCommunity}
    />
  );
};

export default ProfileHeaderSection;
