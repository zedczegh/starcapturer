
import React from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
}) => {
  const { t } = useLanguage();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length + images.length > maxImages) {
        alert(t(`You can only upload a maximum of ${maxImages} images`, `最多只能上传${maxImages}张图片`));
        return;
      }
      
      onImagesChange([...images, ...validFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium mb-2 block">
        {t("Images", "图片")} ({t("optional", "可选")})
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((file, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-lg overflow-hidden border border-border"
          >
            <img 
              src={URL.createObjectURL(file)} 
              alt={`Uploaded ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            className="aspect-square flex flex-col items-center justify-center border-dashed"
            onClick={handleButtonClick}
          >
            <ImagePlus className="mb-2" />
            <span className="text-xs text-center">
              {t("Add Image", "添加图片")}
            </span>
          </Button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        multiple
      />
      
      <p className="text-xs text-muted-foreground">
        {t(`You can upload up to ${maxImages} images (JPG, PNG, GIF)`, `您最多可以上传${maxImages}张图片（JPG、PNG、GIF）`)}
      </p>
    </div>
  );
};

export default ImageUploader;
