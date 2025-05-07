
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Camera, X } from 'lucide-react';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  uploadingAvatar: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  avatarUrl, 
  onAvatarChange, 
  onRemoveAvatar,
  uploadingAvatar 
}: ProfileAvatarProps) => {
  const { t } = useLanguage();
  const [imageLoading, setImageLoading] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset error state and set loading when avatarUrl changes
  React.useEffect(() => {
    if (avatarUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [avatarUrl]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    console.log("Avatar image loaded successfully from URL:", avatarUrl);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error("Failed to load avatar image from URL:", avatarUrl);
  };

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  // Debug if the avatar URL is a blob or from Supabase
  React.useEffect(() => {
    if (avatarUrl) {
      const urlType = avatarUrl.startsWith('blob:') 
        ? 'Blob URL (temporary preview)' 
        : avatarUrl.includes('supabase') 
          ? 'Supabase URL' 
          : 'Other URL';
      
      console.log("Avatar URL type:", urlType, "Value:", avatarUrl);
    }
  }, [avatarUrl]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        {avatarUrl && !imageError ? (
          <div className="relative group">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-full" />
              </div>
            )}
            <img
              src={avatarUrl}
              alt="Profile"
              className={`w-full h-full rounded-full object-cover border-2 border-primary shadow-glow ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              key={avatarUrl} // Add key to force re-render when URL changes
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
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
                    <p>{t("Remove avatar", "删除头像")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-cosmic-800 border-2 border-cosmic-700 shadow-glow flex items-center justify-center">
            <User className="w-12 h-12 text-cosmic-400" />
          </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-all"
                disabled={uploadingAvatar}
              >
                <Camera className="w-5 h-5" />
                <Input
                  ref={inputRef}
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("Change avatar", "更改头像")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-cosmic-400 text-sm mt-2">
        {uploadingAvatar 
          ? t("Uploading...", "上传中...") 
          : avatarUrl && avatarUrl.startsWith('blob:')
            ? t("Save profile to upload", "保存资料以上传头像")
            : t("Click to change", "点击更改")}
      </p>
    </div>
  );
};

export default ProfileAvatar;
