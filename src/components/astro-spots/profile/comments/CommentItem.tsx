import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from '@/integrations/supabase/client';
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

  const getCommentImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    const { data } = supabase.storage.from('message_images').getPublicUrl(imagePath);
    return data?.publicUrl || imagePath;
  };

  const getCommentImages = (commentData: Comment): string[] => {
    if (commentData.image_urls && commentData.image_urls.length > 0) {
      return commentData.image_urls.map(getCommentImageUrl);
    }
    if (commentData.image_url) {
      return [getCommentImageUrl(commentData.image_url)];
    }
    return [];
  };

  const formattedCreatedAt = getFormattedDate(comment.created_at);
  const username = comment.profiles?.username || t("Anonymous", "匿名用户");
  const userInitial = username ? username.charAt(0).toUpperCase() : 'U';
  const commentImages = getCommentImages(comment);

  return (
    <div className="group">
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0 pt-1">
          <Avatar className="w-10 h-10">
            {comment.profiles?.avatar_url ? (
              <AvatarImage 
                src={comment.profiles.avatar_url} 
                alt={username} 
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-muted text-foreground font-medium">
                {userInitial}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="relative">
            {deleting && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Deleting...", "删除中...")}
                </div>
              </div>
            )}
            
            <div className="bg-muted/50 rounded-2xl px-4 py-2.5 max-w-full">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-sm text-left">{username}</span>
                {isCommentOwner && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5"
                        disabled={deleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Delete Comment", "删除评论")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                          {t("Are you sure you want to delete this comment? This action cannot be undone.", 
                             "您确定要删除此评论吗？此操作无法撤销。")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel", "取消")}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteComment} 
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={deleting}
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              {t("Deleting...", "删除中...")}
                            </>
                          ) : (
                            t("Delete", "删除")
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            
              {comment.content && (
                <p className="text-sm text-foreground text-left leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}
            </div>
            
            {commentImages.length > 0 && (
              <div className={`mt-2 grid gap-2 ${commentImages.length === 1 ? 'grid-cols-1' : commentImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} max-w-md`}>
                {commentImages.map((imageUrl, index) => (
                  <div 
                    key={index}
                    className="relative rounded-lg overflow-hidden border border-border/30 cursor-pointer hover:opacity-95 transition-opacity group/img"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <img
                      src={imageUrl}
                      alt={`Comment attachment ${index + 1}`}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: commentImages.length === 1 ? '300px' : '200px' }}
                      onError={(e) => {
                        console.error('Failed to load comment image:', imageUrl);
                        e.currentTarget.parentElement!.style.display = 'none';
                      }}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-muted-foreground">
              <span className="text-left">{formattedCreatedAt}</span>
              {authUser && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleToggleReplyInput}
                  className="text-xs font-semibold hover:underline p-0 h-auto hover:bg-transparent"
                >
                  {t("Reply", "回复")}
                </Button>
              )}
            </div>
          </div>
          
          {showReplyInput && authUser && (
            <div className="mt-3">
              <CommentInput
                onSubmit={handleReplySubmit}
                sending={false}
                isReply={true}
              />
            </div>
          )}
          
          {hasReplies && (
            <div className="mt-4 space-y-4">
              {visibleReplies.map((reply) => {
                const replyImages = getCommentImages(reply);
                return (
                  <div key={reply.id} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 pt-1">
                      <Avatar className="w-8 h-8">
                        {reply.profiles?.avatar_url ? (
                          <AvatarImage 
                            src={reply.profiles.avatar_url} 
                            alt={reply.profiles?.username || t("Anonymous", "匿名用户")} 
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                            {(reply.profiles?.username || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="relative">
                        {deleting && (
                          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {t("Deleting...", "删除中...")}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-muted/50 rounded-2xl px-3 py-2 max-w-full">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-semibold text-xs text-left">
                              {reply.profiles?.username || t("Anonymous", "匿名用户")}
                            </span>
                            {authUser?.id === reply.user_id && onDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={deleting}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("Delete Reply", "删除回复")}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-left">
                                      {t("Are you sure you want to delete this reply? This action cannot be undone.", 
                                         "您确定要删除此回复吗？此操作无法撤销。")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("Cancel", "取消")}</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={handleDeleteComment} 
                                      className="bg-destructive hover:bg-destructive/90"
                                      disabled={deleting}
                                    >
                                      {deleting ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                          {t("Deleting...", "删除中...")}
                                        </>
                                      ) : (
                                        t("Delete", "删除")
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                          
                          {reply.content && (
                            <p className="text-xs text-foreground text-left leading-relaxed whitespace-pre-wrap break-words">
                              {reply.content}
                            </p>
                          )}
                        </div>
                        
                        {replyImages.length > 0 && (
                          <div className={`mt-1.5 grid gap-1.5 ${replyImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} max-w-xs`}>
                            {replyImages.map((imageUrl, index) => (
                              <div 
                                key={index}
                                className="relative rounded-md overflow-hidden border border-border/30 cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(imageUrl, '_blank')}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Reply attachment ${index + 1}`}
                                  className="w-full h-auto object-cover"
                                  style={{ maxHeight: '150px' }}
                                  onError={(e) => {
                                    console.error('Failed to load reply image:', imageUrl);
                                    e.currentTarget.parentElement!.style.display = 'none';
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1 ml-1 text-xs text-muted-foreground">
                          <span className="text-left">{getFormattedDate(reply.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {hasMoreThanFiveReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleReplies}
                  className="text-xs font-semibold text-left ml-11 hover:underline p-0 h-auto"
                >
                  {showAllReplies ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      {t("Show less replies", "显示更少回复")}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      {t("View", "查看")} {comment.replies.length - 5} {t("more replies", "更多回复")}
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
