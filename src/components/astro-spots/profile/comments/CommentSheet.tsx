
import React, { useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Comment } from '../types/comments';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { toast } from "sonner";

interface CommentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  user: boolean;
  onSubmit: (content: string, images?: File[], imageUrls?: string[]) => Promise<void>;
  onReply: (content: string, images: File[], parentId: string, imageUrls?: string[]) => Promise<void>;
  sending: boolean;
}

const CommentSheet: React.FC<CommentSheetProps> = ({
  open,
  onOpenChange,
  comments,
  user,
  onSubmit,
  onReply,
  sending
}) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const commentListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top of comments when new ones are added
  useEffect(() => {
    if (open && commentListRef.current) {
      commentListRef.current.scrollTop = 0; // Scroll to top since comments are shown newest first
    }
  }, [open, comments.length]);

  const handleCommentSubmit = async (content: string, images: File[] = [], imageUrls: string[] = []) => {
    await onSubmit(content, images, imageUrls);
  };

  const handleReply = async (content: string, images: File[] = [], parentId: string, imageUrls: string[] = []) => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return;
    }
    
    // Allow either text or images (or both)
    if (!content.trim() && images.length === 0 && imageUrls.length === 0) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return;
    }
    
    await onReply(content, images, parentId, imageUrls);
  };

  console.log(`CommentSheet received ${comments.length} comments`);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-lg border-border/50">
        <SheetHeader className="border-b border-border/30 pb-4">
          <SheetTitle className="text-foreground font-semibold">
            {t("All Comments", "所有评论")} <span className="text-muted-foreground">({comments.length})</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex flex-col h-[calc(100vh-180px)]">
          <div 
            ref={commentListRef}
            className="flex-1 space-y-6 overflow-y-auto pr-2 styled-scrollbar"
          >
            {comments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-2 text-lg">💬</div>
                <p className="text-sm">{t("No comments yet. Be the first to comment!", "暂无评论。成为第一个评论的人！")}</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onReply={handleReply}
                />
              ))
            )}
          </div>
          
          {user && authUser && (
            <div className="pt-4 mt-4 border-t border-border/30 sticky bottom-0 bg-background/95 backdrop-blur-sm rounded-t-lg">
              <CommentInput
                onSubmit={handleCommentSubmit}
                sending={sending}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentSheet;
