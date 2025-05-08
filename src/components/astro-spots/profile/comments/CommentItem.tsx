
import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Comment } from '../types/comments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const formattedDate = formatDistance(
    new Date(comment.created_at), 
    new Date(), 
    { addSuffix: true }
  );

  // Reset image states when the comment prop changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [comment.image_url]);

  return (
    <div className="flex space-x-3 p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-700/20">
      <Avatar className="h-8 w-8 bg-cosmic-800 border border-cosmic-700/30">
        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
        <AvatarFallback className="text-sm text-cosmic-400">
          {comment.profiles?.username?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex justify-between">
          <div className="text-sm font-medium text-cosmic-200">
            {comment.profiles?.username || "Anonymous"}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-cosmic-400 cursor-help">
                  {formattedDate}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-cosmic-800/90 border-cosmic-700">
                {new Date(comment.created_at).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-sm text-cosmic-300">
          {comment.content && comment.content.trim() !== " " ? comment.content : null}
        </div>
        
        {comment.image_url && !imageError && (
          <div className="relative mt-2 max-w-xs">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-cosmic-800/50 rounded-md">
                <div className="h-5 w-5 border-2 border-t-transparent border-cosmic-300 rounded-full animate-spin"></div>
              </div>
            )}
            <a 
              href={comment.image_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block"
            >
              <img 
                src={comment.image_url} 
                alt="Comment attachment" 
                className={`max-h-40 rounded-md border border-cosmic-700/30 hover:opacity-90 transition-opacity object-cover ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => {
                  console.log("Image loaded successfully:", comment.image_url);
                  setImageLoaded(true);
                }}
                onError={() => {
                  console.error("Failed to load image:", comment.image_url);
                  setImageError(true);
                }}
              />
            </a>
          </div>
        )}
        
        {comment.image_url && imageError && (
          <div className="mt-2 text-xs text-cosmic-400 italic">
            [Image unavailable]
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
