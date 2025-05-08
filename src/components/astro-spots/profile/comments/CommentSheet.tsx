
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
  onSubmit: (content: string, image?: File | null) => void;
  onReply: (content: string, image: File | null, parentId: string) => Promise<void>;
  sending: boolean;
  imageUploadsAvailable?: boolean | null;
}

const CommentSheet: React.FC<CommentSheetProps> = ({
  open,
  onOpenChange,
  comments,
  user,
  onSubmit,
  onReply,
  sending,
  imageUploadsAvailable = true
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

  const handleReply = async (content: string, imageFile: File | null, parentId: string) => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return;
    }
    
    // Validate content is not empty when uploading an image
    if (!content.trim() && imageFile) {
      toast.error(t("Please add some text to your comment", "请为您的评论添加一些文字"));
      return;
    }
    
    await onReply(content, imageFile, parentId);
  };

  console.log(`CommentSheet received ${comments.length} comments`);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto bg-cosmic-900/95 border-cosmic-700">
        <SheetHeader>
          <SheetTitle className="text-cosmic-100">
            {t("All Comments", "所有评论")} ({comments.length})
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex flex-col h-[calc(100vh-150px)]">
          <div 
            ref={commentListRef}
            className="flex-1 space-y-6 overflow-y-auto pr-2"
          >
            {comments.length === 0 ? (
              <div className="text-center py-8 text-cosmic-400">
                {t("No comments yet. Be the first to comment!", "暂无评论。成为第一个评论的人！")}
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
            <div className="pt-4 mt-4 border-t border-cosmic-700/30 sticky bottom-0 bg-cosmic-900/95">
              <CommentInput
                onSubmit={onSubmit}
                sending={sending}
                imageUploadsAvailable={imageUploadsAvailable}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentSheet;
