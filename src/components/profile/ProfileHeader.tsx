
import React from 'react';
import { Star } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-cosmic-800">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-white flex items-center mb-2">
          <Star className="w-7 h-7 text-primary mr-2 animate-pulse" />
          {username}
        </h1>
        <AstronomyTip tip={astronomyTip} />
      </div>
      {/* Avatar on right */}
      <div className="flex-shrink-0">
        <ProfileAvatar 
          avatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
          onRemoveAvatar={onRemoveAvatar}
          uploadingAvatar={uploadingAvatar}
        />
      </div>
    </div>
  );
};

export default ProfileHeader;
