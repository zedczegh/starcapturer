
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from "@/contexts/LanguageContext";
import { Comment } from '../types/comments';
import CommentInput from './CommentInput';
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, imageFile: File | null, parentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply }) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  
  // Determine if we should collapse replies
  const hasReplies = comment.replies && comment.replies.length > 0;
  const hasMoreThanFiveReplies = hasReplies && comment.replies.length > 5;
  const visibleReplies = showAllReplies || !hasMoreThanFiveReplies 
    ? comment.replies || []
    : (comment.replies || []).slice(0, 5);

  const handleToggleReplyInput = () => {
    setShowReplyInput(!showReplyInput);
  };

  const handleToggleReplies = () => {
    setShowAllReplies(!showAllReplies);
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

  const getFormattedDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error("Invalid date format:", dateString, error);
      return "recently";
    }
  };

  const formattedCreatedAt = getFormattedDate(comment.created_at);
  const username = comment.profiles?.username || t("Anonymous", "匿名用户");
  const userInitial = username ? username.charAt(0).toUpperCase() : 'U';

  const isReply = false; // Main comments are not replies

  return (
    <div className={`flex gap-3 ${isReply ? 'pl-8 mt-3' : ''}`}>
      <div className="flex-shrink-0">
        <Avatar className="w-9 h-9">
          {comment.profiles?.avatar_url ? (
            <AvatarImage 
              src={comment.profiles.avatar_url} 
              alt={username} 
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-cosmic-800 text-cosmic-200">
              {userInitial}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      <div className="flex-grow">
        <div className="bg-cosmic-800/40 rounded-lg p-3">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-cosmic-200">{username}</span>
            <span className="text-xs text-cosmic-400">{formattedCreatedAt}</span>
          </div>
          <p className="mt-1 text-sm text-cosmic-100">
            {comment.content}
          </p>
          
          {/* Image attachment */}
          {comment.image_url && (
            <div className="mt-2">
              <img 
                src={comment.image_url}
                alt={t("Comment attachment", "评论附件")}
                className="max-h-48 rounded-md border border-cosmic-700/50"
                onError={(e) => {
                  // Handle image loading errors
                  console.error("Failed to load comment image:", comment.image_url);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        
        {/* Reply button */}
        {!isReply && authUser && (
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
        {hasReplies && (
          <div className="mt-3 space-y-3">
            {visibleReplies.map((reply) => (
              <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-cosmic-700/30">
                <div className="flex-shrink-0">
                  <Avatar className="w-7 h-7">
                    {reply.profiles?.avatar_url ? (
                      <AvatarImage 
                        src={reply.profiles.avatar_url} 
                        alt={reply.profiles?.username || t("Anonymous", "匿名用户")} 
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-cosmic-800 text-cosmic-200 text-xs">
                        {(reply.profiles?.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="flex-grow">
                  <div className="bg-cosmic-800/30 rounded-lg p-2">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-xs text-cosmic-200">
                        {reply.profiles?.username || t("Anonymous", "匿名用户")}
                      </span>
                      <span className="text-xs text-cosmic-500">{getFormattedDate(reply.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-cosmic-100">
                      {reply.content}
                    </p>
                    
                    {/* Reply image attachment */}
                    {reply.image_url && (
                      <div className="mt-2">
                        <img 
                          src={reply.image_url}
                          alt={t("Reply attachment", "回复附件")}
                          className="max-h-32 rounded-md border border-cosmic-700/50"
                          onError={(e) => {
                            // Handle image loading errors
                            console.error("Failed to load reply image:", reply.image_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* View more/less replies toggle */}
            {hasMoreThanFiveReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleReplies}
                className="text-xs text-cosmic-400 hover:text-cosmic-200 p-1 h-auto ml-4"
              >
                {showAllReplies ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    {t("Show less replies", "显示更少回复")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {t("Show all replies", "显示所有回复")} 
                    ({comment.replies.length - 5} {t("more", "更多")})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
