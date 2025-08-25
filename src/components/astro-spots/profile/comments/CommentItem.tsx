
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
  onReply: (content: string, images: File[], parentId: string, imageUrls?: string[]) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply }) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  
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

  const handleReplySubmit = async (content: string, images: File[] = [], imageUrls: string[] = []) => {
    if (!authUser) return;
    await onReply(content, images, comment.id, imageUrls);
    setShowReplyInput(false);
  };

  const getFormattedDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "recently";
    }
  };

  const formattedCreatedAt = getFormattedDate(comment.created_at);
  const username = comment.profiles?.username || t("Anonymous", "匿名用户");
  const userInitial = username ? username.charAt(0).toUpperCase() : 'U';

  const isReply = false; // Main comments are not replies

  return (
    <div className={`group ${isReply ? 'pl-6 mt-4 border-l-2 border-border/30' : ''}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Avatar className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} ring-2 ring-background shadow-sm`}>
            {comment.profiles?.avatar_url ? (
              <AvatarImage 
                src={comment.profiles.avatar_url} 
                alt={username} 
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {userInitial}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-border/80">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm text-foreground">{username}</span>
              <span className="text-xs text-muted-foreground">{formattedCreatedAt}</span>
            </div>
            
            {comment.content && (
              <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                {comment.content}
              </p>
            )}
            
            {/* Image attachments */}
            {(() => {
              console.log("=== DISPLAY DEBUG ===");
              console.log("Comment ID:", comment.id);
              console.log("Comment image_urls:", comment.image_urls);
              console.log("Comment image_url:", comment.image_url);
              console.log("Has image_urls array:", Array.isArray(comment.image_urls));
              console.log("Image_urls length:", comment.image_urls?.length);
              console.log("=== DISPLAY DEBUG END ===");
              return null;
            })()}
            
            {(comment.image_urls && comment.image_urls.length > 0) ? (
              <div className={`grid gap-2 mb-3 ${comment.image_urls.length === 1 ? 'grid-cols-1 max-w-sm' : comment.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {comment.image_urls.map((url, idx) => (
                  <div key={idx} className="aspect-square overflow-hidden rounded-lg border border-border/30 bg-muted/20">
                    <img
                      src={url}
                      alt={t("Comment attachment", "评论附件") + ` ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-105 cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : (
              comment.image_url && (
                <div className="mb-3 max-w-sm">
                  <div className="aspect-square overflow-hidden rounded-lg border border-border/30 bg-muted/20">
                    <img 
                      src={comment.image_url}
                      alt={t("Comment attachment", "评论附件")}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-105 cursor-pointer"
                      onClick={() => window.open(comment.image_url!, '_blank')}
                      loading="lazy"
                    />
                  </div>
                </div>
              )
            )}
          </div>
          
          {/* Reply button */}
          {!isReply && authUser && (
            <div className="mt-2 ml-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleToggleReplyInput}
                className="text-xs text-muted-foreground hover:text-foreground p-2 h-auto font-medium transition-all duration-200 hover:bg-muted/50 rounded-lg"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                {t("Reply", "回复")}
              </Button>
            </div>
          )}
          
          {/* Reply input */}
          {showReplyInput && authUser && (
            <div className="mt-3 ml-1">
              <CommentInput
                onSubmit={handleReplySubmit}
                sending={false}
                isReply={true}
              />
            </div>
          )}
          
          {/* Replies section */}
          {hasReplies && (
            <div className="mt-4 space-y-4">
              {visibleReplies.map((reply) => (
                <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-border/20">
                  <div className="flex-shrink-0">
                    <Avatar className="w-7 h-7 ring-1 ring-background">
                      {reply.profiles?.avatar_url ? (
                        <AvatarImage 
                          src={reply.profiles.avatar_url} 
                          alt={reply.profiles?.username || t("Anonymous", "匿名用户")} 
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {(reply.profiles?.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-xs text-foreground">
                          {reply.profiles?.username || t("Anonymous", "匿名用户")}
                        </span>
                        <span className="text-xs text-muted-foreground">{getFormattedDate(reply.created_at)}</span>
                      </div>
                      
                      {reply.content && (
                        <p className="text-sm text-foreground/90 leading-relaxed mb-2">
                          {reply.content}
                        </p>
                      )}
                      
                      {/* Reply image attachments */}
                      {(reply.image_urls && reply.image_urls.length > 0) ? (
                        <div className="mt-2">
                          {reply.image_urls.length === 1 ? (
                            <div className="max-w-sm overflow-hidden rounded-md border border-border/30 bg-muted/20">
                              <img
                                src={reply.image_urls[0]}
                                alt={t("Reply attachment", "回复附件")}
                                className="w-full h-auto object-cover transition-transform duration-200 hover:scale-105 cursor-pointer"
                                onClick={() => window.open(reply.image_urls![0], '_blank')}
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {reply.image_urls.map((url, idx) => (
                                <div key={idx} className="aspect-square overflow-hidden rounded-md border border-border/30 bg-muted/20">
                                  <img
                                    src={url}
                                    alt={t("Reply attachment", "回复附件") + ` ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105 cursor-pointer"
                                     onClick={() => window.open(url, '_blank')}
                                     loading="lazy"
                                   />
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       ) : reply.image_url ? (
                         <div className="mt-2 max-w-32">
                           <div className="aspect-square overflow-hidden rounded-md border border-border/30 bg-muted/20">
                             <img 
                               src={reply.image_url}
                               alt={t("Reply attachment", "回复附件")}
                               className="w-full h-full object-cover transition-transform duration-200 hover:scale-105 cursor-pointer"
                               onClick={() => window.open(reply.image_url!, '_blank')}
                             />
                           </div>
                         </div>
                       ) : null}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View more/less replies toggle */}
              {hasMoreThanFiveReplies && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleReplies}
                  className="text-xs ml-4 bg-background/50 hover:bg-background border-border/50 transition-all duration-200"
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
    </div>
  );
};

export default CommentItem;
