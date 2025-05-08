
import React from 'react';
import { formatDistance } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Comment } from '../types/comments';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const formattedDate = formatDistance(
    new Date(comment.created_at), 
    new Date(), 
    { addSuffix: true }
  );

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
          <div className="text-xs text-cosmic-400">
            {formattedDate}
          </div>
        </div>
        
        <div className="text-sm text-cosmic-300">
          {comment.content}
        </div>
        
        {comment.image_url && (
          <a 
            href={comment.image_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block mt-2"
          >
            <img 
              src={comment.image_url} 
              alt="Comment attachment" 
              className="max-h-40 rounded-md border border-cosmic-700/30 hover:opacity-90 transition-opacity"
            />
          </a>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
