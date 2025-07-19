
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileAvatar from './ProfileAvatar';
import AstronomyTip from './AstronomyTip';
import { AdminBadge } from './AdminBadge';

interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  uploadingAvatar: boolean;
  astronomyTip: [string, string] | null;
  bio: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  avatarUrl,
  onAvatarChange,
  onRemoveAvatar,
  uploadingAvatar,
  astronomyTip,
  bio
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col pb-6 border-b border-cosmic-800/70 mb-2">
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cosmic-300">
              {username}
            </h1>
            <AdminBadge size="md" />
          </div>
          <p className="text-cosmic-400 mt-1">{t("Stargazer Profile", "星空观察者个人资料")}</p>
        </div>
      </div>
      
      <AstronomyTip tip={astronomyTip} />
    </div>
  );
};

export default ProfileHeader;
