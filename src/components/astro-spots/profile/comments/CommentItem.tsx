
import React, { useState } from 'react';
import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Comment } from '../types/comments';
import CommentInput from './CommentInput';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import CommentAvatar from './CommentAvatar';
import CommentContent from './CommentContent';
import RepliesSection from './RepliesSection';

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, imageFile: File | null, parentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply }) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleToggleReplyInput = () => {
    setShowReplyInput(!showReplyInput);
  };

  const handleReplySubmit = async (content: string, imageFile: File | null) => {
    if (!authUser) return;
    
    try {
      setReplySubmitting(true);
      await onReply(content, imageFile, comment.id);
      setShowReplyInput(false);
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <CommentAvatar 
          avatarUrl={comment.profiles?.avatar_url} 
          username={comment.profiles?.username}
        />
      </div>
      <div className="flex-grow">
        <CommentContent
          username={comment.profiles?.username}
          createdAt={comment.created_at}
          content={comment.content}
          imageUrl={comment.image_url}
        />
        
        {/* Reply button */}
        {authUser && (
          <div className="mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleToggleReplyInput}
              className="text-xs text-cosmic-400 hover:text-cosmic-200 p-1 h-auto"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              {t("Reply", "回复")}
            </Button>
          </div>
        )}
        
        {/* Reply input */}
        {showReplyInput && authUser && (
          <div className="mt-2">
            <CommentInput
              onSubmit={handleReplySubmit}
              sending={replySubmitting}
              isReply={true}
            />
          </div>
        )}
        
        {/* Replies section */}
        {comment.replies && comment.replies.length > 0 && (
          <RepliesSection replies={comment.replies} />
        )}
      </div>
    </div>
  );
};

export default CommentItem;
