
import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Comment } from '../types/comments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageIcon, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import CommentInput from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  onReply?: (content: string, imageFile: File | null, parentId: string) => Promise<void>;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, depth = 0 }) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  
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
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReply = async (content: string, imageFile: File | null) => {
    if (onReply) {
      await onReply(content, imageFile, comment.id);
      setShowReplyInput(false);
      setShowReplies(true);
    }
  };

  const toggleReplyInput = () => {
    setShowReplyInput(prev => !prev);
  };

  const toggleReplies = () => {
    setShowReplies(prev => !prev);
  };

  return (
    <div className={`flex space-x-3 ${depth > 0 ? 'ml-6 mt-3' : ''}`}>
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

        {/* Reply actions */}
        {depth < 2 && onReply && (
          <div className="flex items-center gap-2 mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-cosmic-400 hover:text-cosmic-100 p-0 h-auto"
              onClick={toggleReplyInput}
            >
              <Reply className="h-3.5 w-3.5 mr-1" />
              {t("Reply", "回复")}
            </Button>
            
            {hasReplies && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-cosmic-400 hover:text-cosmic-100 p-0 h-auto"
                onClick={toggleReplies}
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    {t("Hide replies", "隐藏回复")} ({comment.replies?.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {t("Show replies", "显示回复")} ({comment.replies?.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Reply input */}
        {showReplyInput && depth < 2 && onReply && (
          <div className="mt-2 mb-3">
            <CommentInput
              onSubmit={handleReply}
              sending={false}
              isReply={true}
            />
          </div>
        )}
        
        {/* Display replies */}
        {hasReplies && showReplies && (
          <div className="mt-3 space-y-3 border-l-2 border-cosmic-700/30 pl-3">
            {comment.replies?.map((reply) => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
