
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from "@/contexts/LanguageContext";
import { Comment } from '../types/comments';
import CommentInput from './CommentInput';
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import defaultAvatar from '@/assets/default-avatar.png';

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, image: File | null, parentId: string) => Promise<void>;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, isReply = false }) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Add state for showing/hiding replies when there are more than 5
  const [showAllReplies, setShowAllReplies] = useState(false);
  const hasMoreThanFiveReplies = comment.replies && comment.replies.length > 5;
  
  // Display either all replies or just the first 5 based on showAllReplies state
  const visibleReplies = hasMoreThanFiveReplies && !showAllReplies 
    ? comment.replies.slice(0, 5) 
    : comment.replies;

  const handleReplySubmit = async (content: string, image: File | null) => {
    if (!authUser) return;
    
    setSending(true);
    try {
      await onReply(content, image, comment.id);
      setShowReplyInput(false);
    } finally {
      setSending(false);
    }
  };

  const formattedCreatedAt = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const username = comment.profiles.username || t("Anonymous", "匿名用户");

  return (
    <div className={`flex gap-3 ${isReply ? 'pl-8 mt-3' : ''}`}>
      <div className="flex-shrink-0">
        <img
          src={comment.profiles.avatar_url || defaultAvatar}
          alt={username}
          className="w-9 h-9 rounded-full object-cover bg-cosmic-800"
        />
      </div>
      <div className="flex-grow">
        <div className="bg-cosmic-800/40 rounded-lg p-3">
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-cosmic-200">{username}</div>
            <div className="text-xs text-cosmic-400">{formattedCreatedAt}</div>
          </div>
          <div className="text-cosmic-300">{comment.content}</div>
          
          {/* Display image if there is one */}
          {comment.image_url && (
            <div className="mt-2">
              <img
                src={comment.image_url}
                alt="Comment attachment"
                className="max-h-60 rounded-md cursor-pointer"
                onClick={() => window.open(comment.image_url, '_blank')}
              />
            </div>
          )}
        </div>
        
        {/* Reply button */}
        {!isReply && (
          <div className="mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-cosmic-400 hover:text-cosmic-300 p-0"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {t("Reply", "回复")}
            </Button>
          </div>
        )}
        
        {/* Reply input */}
        {showReplyInput && (
          <div className="mt-2">
            <CommentInput
              onSubmit={handleReplySubmit}
              sending={sending}
              isReply={true}
            />
          </div>
        )}
        
        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {hasMoreThanFiveReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex items-center text-cosmic-400 hover:text-cosmic-300"
                onClick={() => setShowAllReplies(!showAllReplies)}
              >
                {showAllReplies ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    {t("Show less replies", "显示较少回复")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {t("Show all {{count}} replies", "显示全部 {{count}} 条回复").replace('{{count}}', String(comment.replies.length))}
                  </>
                )}
              </Button>
            )}
            
            {visibleReplies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
