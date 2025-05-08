
import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Comment } from '../types/comments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageIcon } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { t } = useLanguage();
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

  const username = comment.profiles?.username || t("Anonymous", "匿名用户");
  const initials = username ? username[0]?.toUpperCase() : "?";
  
  // Check if comment has only content (no image) or both
  const hasImage = comment.image_url && !imageError;
  const hasContent = comment.content && comment.content.trim() !== " ";

  return (
    <div className="flex space-x-3">
      <Avatar className="h-10 w-10 shrink-0 bg-cosmic-800 border border-cosmic-700/30">
        <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={username} />
        <AvatarFallback className="text-sm text-cosmic-400">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-medium text-cosmic-200">
            {username}
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
        
        <div className="bg-cosmic-800/40 p-3 rounded-lg rounded-tl-none border border-cosmic-700/20">
          {/* Show comment text if it exists and isn't just a blank space */}
          {hasContent && (
            <div className="text-sm text-cosmic-300">
              {comment.content}
            </div>
          )}
          
          {/* Comment image handling with better error states */}
          {hasImage && (
            <div className={`relative ${hasContent ? 'mt-3' : 'mt-0'}`}>
              {!imageLoaded && (
                <div className="h-24 w-full max-w-xs flex items-center justify-center bg-cosmic-800/50 rounded-md">
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
                  alt={t("Comment attachment", "评论附件")}
                  className={`max-h-60 w-auto rounded-md border border-cosmic-700/30 hover:opacity-90 transition-opacity ${!imageLoaded ? 'hidden' : 'block'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    console.error("Failed to load image:", comment.image_url);
                    setImageError(true);
                  }}
                />
              </a>
            </div>
          )}
          
          {comment.image_url && imageError && (
            <div className="p-3 bg-cosmic-800/20 rounded border border-cosmic-700/20 flex items-center">
              <ImageIcon className="h-4 w-4 text-cosmic-400 mr-2" />
              <span className="text-xs text-cosmic-400 italic">
                {t("Image unavailable", "图片不可用")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
