
import React from 'react';
import { Comment } from '../types/comments';
import CommentAvatar from './CommentAvatar';
import CommentContent from './CommentContent';

interface ReplyItemProps {
  reply: Comment;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ reply }) => {
  return (
    <div className="flex gap-3 pl-4 border-l-2 border-cosmic-700/30">
      <div className="flex-shrink-0">
        <CommentAvatar 
          avatarUrl={reply.profiles?.avatar_url} 
          username={reply.profiles?.username}
          size="sm"
        />
      </div>
      <div className="flex-grow">
        <CommentContent
          username={reply.profiles?.username}
          createdAt={reply.created_at}
          content={reply.content}
          imageUrl={reply.image_url}
          isReply={true}
        />
      </div>
    </div>
  );
};

export default ReplyItem;
