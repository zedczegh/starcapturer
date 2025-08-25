
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import CommentInput from "./CommentInput";
import { Comment } from '../types/comments';
import { useAuth } from "@/contexts/AuthContext";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, imageFile: File | null, parentId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onDelete }) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
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

  const handleDeleteComment = async () => {
    if (!onDelete) return;
    
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeleting(false);
    }
  };

  const isCommentOwner = authUser?.id === comment.user_id;

  const handleReplySubmit = async (content: string, imageFile: File | null = null) => {
    if (!authUser) return;
    await onReply(content, imageFile, comment.id);
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formattedCreatedAt}</span>
                {isCommentOwner && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Delete Comment", "删除评论")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("Are you sure you want to delete this comment? This action cannot be undone.", 
                             "您确定要删除此评论吗？此操作无法撤销。")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel", "取消")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">
                          {t("Delete", "删除")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            
            {comment.content && (
              <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                {comment.content}
              </p>
            )}
            
            {comment.image_url && (
              <div className="mt-2">
                <img
                  src={comment.image_url}
                  alt="Comment attachment"
                  className="max-w-xs h-auto rounded-lg border border-border/30 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                  onClick={() => window.open(comment.image_url!, '_blank')}
                />
              </div>
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{getFormattedDate(reply.created_at)}</span>
                          {authUser?.id === reply.user_id && onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  disabled={deleting}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("Delete Reply", "删除回复")}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("Are you sure you want to delete this reply? This action cannot be undone.", 
                                       "您确定要删除此回复吗？此操作无法撤销。")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("Cancel", "取消")}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(reply.id)} className="bg-destructive hover:bg-destructive/90">
                                    {t("Delete", "删除")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                      
                      {reply.content && (
                        <p className="text-sm text-foreground/90 leading-relaxed mb-2">
                          {reply.content}
                        </p>
                      )}
                      
                      {reply.image_url && (
                        <div className="mt-2">
                          <img
                            src={reply.image_url}
                            alt="Reply attachment"
                            className="max-w-32 h-auto rounded-md border border-border/30 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '120px', objectFit: 'cover' }}
                            onClick={() => window.open(reply.image_url!, '_blank')}
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
