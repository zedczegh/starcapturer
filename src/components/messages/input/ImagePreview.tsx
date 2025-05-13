
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImagePreviewProps {
  imagePreview: string | null;
  onRemoveImage: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imagePreview, onRemoveImage }) => {
  if (!imagePreview) return null;
  
  return (
    <div className="relative inline-block">
      <img 
        src={imagePreview} 
        alt="Preview" 
        className="h-20 rounded-md border border-cosmic-700/50"
      />
      <Button
        variant="destructive"
        size="sm"
        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
        onClick={onRemoveImage}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default ImagePreview;
