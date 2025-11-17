import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkPreviewData {
  postId: string;
  postOwnerId: string;
  imageUrl: string;
  description: string;
  ownerUsername: string;
}

interface LinkPreviewProps {
  data: LinkPreviewData;
  onRemove: () => void;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ data, onRemove }) => {
  return (
    <div className="relative mb-2 border border-primary/30 rounded-lg overflow-hidden bg-cosmic-900/50 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 h-6 w-6 p-0 rounded-full bg-cosmic-900/80 hover:bg-cosmic-800"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={data.imageUrl}
            alt="Post preview"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cosmic-300 mb-1">
            Post by @{data.ownerUsername}
          </p>
          <p className="text-sm text-foreground line-clamp-2">
            {data.description || 'No description'}
          </p>
        </div>
      </div>
    </div>
  );
};
