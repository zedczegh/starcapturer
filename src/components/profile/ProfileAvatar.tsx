
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
      <div className="relative w-32 h-32">
        {avatarUrl ? (
          <div className="relative group">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-cosmic-700/30 shadow-2xl ring-4 ring-cosmic-800/50">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
              />
            </div>
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
          <div className="w-full h-full rounded-full bg-gradient-to-br from-cosmic-700/60 to-cosmic-900/90 flex items-center justify-center shadow-2xl ring-4 ring-cosmic-800/50">
            <User className="w-16 h-16 text-cosmic-400" />
          </div>
        )}
        
        <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-full cursor-pointer shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all hover:scale-110">
          <Camera className="w-6 h-6" />
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-cosmic-400 text-sm mt-3">
        {uploadingAvatar ? t("Uploading...", "上传中...") : t("Click camera to change", "点击相机更改")}
      </p>
    </div>
  );
};

export default ProfileAvatar;
