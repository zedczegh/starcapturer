
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Camera, X } from 'lucide-react';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  uploadingAvatar: boolean;
}

const ProfileAvatar = ({ 
  avatarUrl, 
  onAvatarChange, 
  onRemoveAvatar,
  uploadingAvatar 
}: ProfileAvatarProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        {avatarUrl ? (
          <div className="relative group">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-2 border-primary/30 shadow-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={onRemoveAvatar} 
                className="text-white p-1 rounded-full hover:text-red-400 transition-colors"
                type="button"
                aria-label={t("Remove avatar", "删除头像")}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-cosmic-800/60 flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-cosmic-400" />
          </div>
        )}
        
        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-all">
          <Camera className="w-5 h-5" />
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-cosmic-400 text-sm mt-2">
        {uploadingAvatar ? t("Uploading...", "上传中...") : t("Click to change", "点击更改")}
      </p>
    </div>
  );
};

export default ProfileAvatar;
