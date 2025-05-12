
import React from 'react';
import { Button } from "@/components/ui/button";
import { Wrench } from 'lucide-react';

interface ProfileEditButtonProps {
  isCreator: boolean;
  comingFromCommunity: boolean;
  onClick: () => void;
}

const ProfileEditButton: React.FC<ProfileEditButtonProps> = ({ isCreator, comingFromCommunity, onClick }) => {
  if (!isCreator || comingFromCommunity) return null;
  
  return (
    <Button
      variant="default"
      size="icon"
      className="absolute -top-2 -left-2 z-10 bg-primary/20 hover:bg-primary/30 text-white rounded-full w-12 h-12 shadow-lg border border-cosmic-700/30"
      onClick={onClick}
    >
      <Wrench className="h-6 w-6" />
    </Button>
  );
};

export default ProfileEditButton;
