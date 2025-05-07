
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileAvatar from './ProfileAvatar';
import AstronomyTip from './AstronomyTip';

interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  uploadingAvatar: boolean;
  astronomyTip: [string, string] | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  avatarUrl,
  onAvatarChange,
  onRemoveAvatar,
  uploadingAvatar,
  astronomyTip
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col pb-4 border-b border-cosmic-800">
      <div className="flex items-center gap-6 mb-4">
        {/* Avatar on left */}
        <div className="flex-shrink-0">
          <ProfileAvatar 
            avatarUrl={avatarUrl}
            onAvatarChange={onAvatarChange}
            onRemoveAvatar={onRemoveAvatar}
            uploadingAvatar={uploadingAvatar}
          />
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            {username}
          </h1>
        </div>
      </div>
      
      <AstronomyTip tip={astronomyTip} />
    </div>
  );
};

export default ProfileHeader;
