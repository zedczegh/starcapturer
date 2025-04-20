
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Camera, X, Loader2 } from 'lucide-react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("Image too large (max 5MB)", "图片太大（最大5MB）"));
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error(t("File must be an image", "文件必须是图像"));
      return;
    }
    
    onAvatarChange(e);
  };

  const handleClickUpload = () => {
    // If there's already an avatar, open it in a new tab
    if (avatarUrl) {
      window.open(avatarUrl, '_blank');
    } else {
      // If no avatar, trigger file input
      fileInputRef.current?.click();
    }
  };

  return (
    <TooltipProvider>
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
                  "w-full h-full rounded-full object-cover border-2 border-primary shadow-glow transition-all duration-300 cursor-pointer",
                  isHovered && "brightness-75"
                )}
                onClick={() => window.open(avatarUrl, '_blank')}
              />
              <div 
                className={cn(
                  "absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-opacity",
                  isHovered ? "opacity-100" : "opacity-0",
                  "md:group-hover:opacity-100"
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={onRemoveAvatar} 
                      className="text-white p-1 rounded-full hover:text-red-400 transition-colors"
                      type="button"
                      aria-label={t("Remove avatar", "删除头像")}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("Remove avatar", "删除头像")}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-cosmic-800 border-2 border-cosmic-700 shadow-glow flex items-center justify-center">
              <User className="w-12 h-12 text-cosmic-400" />
            </div>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <label 
                htmlFor="avatar-upload" 
                className={cn(
                  "absolute -bottom-1 -right-1 text-white p-2 rounded-full cursor-pointer shadow-md transition-all",
                  uploadingAvatar ? "bg-gray-500" : "bg-primary hover:bg-primary/90"
                )}
                onClick={handleClickUpload}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <Input
                  ref={fileInputRef}
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>
              {avatarUrl 
                ? t("View full image", "查看完整图片")
                : t("Upload avatar", "上传头像")
              }
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-cosmic-400 text-sm mt-2">
          {uploadingAvatar 
            ? t("Uploading...", "上传中...") 
            : avatarUrl 
              ? t("Click to view or remove", "点击查看或删除") 
              : t("Click to add photo", "点击添加照片")
          }
        </p>
      </div>
    </TooltipProvider>
  );
};

export default ProfileAvatar;
