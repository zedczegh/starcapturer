import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FeaturedAlbumManager } from './FeaturedAlbumManager';

interface FeaturedAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isOwnProfile: boolean;
  onAvatarSelect?: (imageUrl: string) => void;
}

export const FeaturedAlbumDialog: React.FC<FeaturedAlbumDialogProps> = ({
  open,
  onOpenChange,
  userId,
  isOwnProfile,
  onAvatarSelect
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-cosmic-900/95 backdrop-blur-2xl border border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
            Featured Album
          </DialogTitle>
        </DialogHeader>
        <FeaturedAlbumManager 
          userId={userId}
          isOwnProfile={isOwnProfile}
          onAvatarSelect={onAvatarSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
