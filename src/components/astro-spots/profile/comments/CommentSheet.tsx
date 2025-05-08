
import React from 'react';
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t("All Comments", "所有评论")} ({comments.length})
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          {user && (
            <div className="mb-6">
              <CommentInput
                onSubmit={onSubmit}
                sending={sending}
              />
            </div>
          )}
          
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-cosmic-400">
                {t("No comments yet. Be the first to comment!", "暂无评论。成为第一个评论的人！")}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentSheet;
