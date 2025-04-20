
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Camera, X, Loader2 } from 'lucide-react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        {avatarUrl ? (
          <div 
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={avatarUrl}
              alt="Profile"
              className={cn(
                "w-full h-full rounded-full object-cover border-2 border-primary shadow-glow transition-all duration-300",
                isHovered && "brightness-75"
              )}
            />
            <div 
              className={cn(
                "absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-opacity",
                isHovered ? "opacity-100" : "opacity-0",
                "md:group-hover:opacity-100"
              )}
            >
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
          <div className="w-full h-full rounded-full bg-cosmic-800 border-2 border-cosmic-700 shadow-glow flex items-center justify-center">
            <User className="w-12 h-12 text-cosmic-400" />
          </div>
        )}
        
        <label 
          htmlFor="avatar-upload" 
          className={cn(
            "absolute -bottom-1 -right-1 text-white p-2 rounded-full cursor-pointer shadow-md transition-all",
            uploadingAvatar ? "bg-gray-500" : "bg-primary hover:bg-primary/90"
          )}
        >
          {uploadingAvatar ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="hidden"
            disabled={uploadingAvatar}
          />
        </label>
      </div>
      <p className="text-cosmic-400 text-sm mt-2">
        {uploadingAvatar 
          ? t("Uploading...", "上传中...") 
          : avatarUrl 
            ? t("Click to change or remove", "点击更改或删除") 
            : t("Click to add photo", "点击添加照片")
        }
      </p>
    </div>
  );
};

export default ProfileAvatar;
