
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileAvatar from './ProfileAvatar';
import AstronomyTip from './AstronomyTip';
import { Textarea } from '@/components/ui/textarea';

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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cosmic-300">
            {username}
          </h1>
          <p className="text-cosmic-400 mt-1">{t("Stargazer Profile", "星空观察者个人资料")}</p>
        </div>
      </div>
      
      <AstronomyTip tip={astronomyTip} />

      {/* Bio section */}
      <div className="mt-4 bg-gradient-to-r from-cosmic-800/50 to-cosmic-900/40 rounded-lg p-4 border border-cosmic-700/30 backdrop-blur-sm">
        <h3 className="text-cosmic-100 font-medium mb-2">{t("About Me", "关于我")}</h3>
        <Textarea
          className="bg-cosmic-800/30 border-cosmic-700/40 text-cosmic-100 placeholder:text-cosmic-400/60 min-h-[100px] resize-y"
          placeholder={t("Share a bit about yourself, your interests in astronomy, or your favorite celestial objects to observe...", "分享一些关于您自己的信息，您对天文学的兴趣，或者您最喜欢观察的天体物体...")}
          defaultValue={bio || ""}
          id="bio"
          name="bio"
        />
      </div>
    </div>
  );
};

export default ProfileHeader;
