import React from 'react';
import { Reply } from 'lucide-react';

interface ParentMessagePreviewProps {
  parentText?: string;
  parentImageUrl?: string;
}

export const ParentMessagePreview: React.FC<ParentMessagePreviewProps> = ({ 
  parentText, 
  parentImageUrl 
}) => {
  return (
    <div className="mb-2 pl-2 border-l-2 border-primary/40 bg-cosmic-700/20 rounded-r px-2 py-1 flex items-start gap-2">
      <Reply className="h-3 w-3 text-primary/60 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-cosmic-300 truncate flex-1">
        {parentImageUrl && !parentText && '📷 Image'}
        {parentText || 'Message'}
      </div>
    </div>
  );
};
