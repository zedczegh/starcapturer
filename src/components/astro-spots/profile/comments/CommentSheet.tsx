
import React, { useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Comment } from '../types/comments';
import { useLanguage } from "@/contexts/LanguageContext";
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface CommentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  user: boolean;
  onSubmit: (content: string, image?: File | null) => void;
  sending: boolean;
}

const CommentSheet: React.FC<CommentSheetProps> = ({
  open,
  onOpenChange,
  comments,
  user,
  onSubmit,
  sending
}) => {
  const { t } = useLanguage();
  const commentListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of comments when new ones are added
  useEffect(() => {
    if (open && commentListRef.current) {
      commentListRef.current.scrollTop = 0; // Scroll to top since comments are shown newest first
    }
  }, [open, comments.length]);

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
            className="flex-1 space-y-4 overflow-y-auto pr-2"
          >
            {comments.length === 0 ? (
              <div className="text-center py-8 text-cosmic-400">
                {t("No comments yet. Be the first to comment!", "暂无评论。成为第一个评论的人！")}
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
          
          {user && (
            <div className="pt-4 mt-4 border-t border-cosmic-700/30 sticky bottom-0 bg-cosmic-900/95">
              <CommentInput
                onSubmit={onSubmit}
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
