
import React from 'react';
import { Album } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

interface SpotImagesProps {
  images: string[];
  onShowDialog: () => void;
}

const SpotImages: React.FC<SpotImagesProps> = ({ images, onShowDialog }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
        <Album className="h-5 w-5 mr-2 text-primary/80" />
        {t("Location Images", "位置图片")}
      </h2>
      
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((imageUrl, index) => (
            <div 
              key={index} 
              className="relative aspect-square overflow-hidden rounded-lg border border-cosmic-600/30 shadow-md"
              onClick={onShowDialog}
            >
              <img 
                src={imageUrl} 
                alt={`Location image ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Album className="h-12 w-12 text-gray-500 mb-3" />
          <p className="text-gray-400">
            {t("No images available", "暂无图片")}
          </p>
        </div>
      )}
    </div>
  );
};

export default SpotImages;
