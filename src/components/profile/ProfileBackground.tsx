import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileBackgroundProps {
  backgroundUrl: string | null;
  onBackgroundChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBackground: () => void;
  uploadingBackground: boolean;
}

const ProfileBackground = ({ 
  backgroundUrl, 
  onBackgroundChange, 
  onRemoveBackground,
  uploadingBackground 
}: ProfileBackgroundProps) => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden group">
      {backgroundUrl ? (
        <>
          <img
            src={backgroundUrl}
            alt="Profile Background"
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-4">
            <Button
              onClick={onRemoveBackground}
              variant="destructive"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <X className="w-4 h-4 mr-2" />
              {t("Remove", "删除")}
            </Button>
            <label htmlFor="background-upload" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                asChild
              >
                <span className="cursor-pointer">
                  <Camera className="w-4 h-4 mr-2" />
                  {t("Change", "更改")}
                </span>
              </Button>
            </label>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-cosmic-800/40 to-cosmic-900/60 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary/30">
          <ImageIcon className="w-12 h-12 text-cosmic-400 mb-2" />
          <p className="text-cosmic-300 text-sm mb-4">
            {t("Add background image", "添加背景图片")}
          </p>
          <label htmlFor="background-upload">
            <Button
              variant="outline"
              size="sm"
              type="button"
              asChild
            >
              <span className="cursor-pointer">
                <Camera className="w-4 h-4 mr-2" />
                {uploadingBackground ? t("Uploading...", "上传中...") : t("Upload", "上传")}
              </span>
            </Button>
          </label>
        </div>
      )}
      
      <Input
        id="background-upload"
        type="file"
        accept="image/*"
        onChange={onBackgroundChange}
        className="hidden"
        disabled={uploadingBackground}
      />
    </div>
  );
};

export default ProfileBackground;
