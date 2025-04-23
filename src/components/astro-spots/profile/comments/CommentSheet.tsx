
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatePresence } from 'framer-motion';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { Comment } from '../types/comments';

interface CommentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  user: boolean;
  onSubmit: (content: string) => Promise<void>;
  sending: boolean;
}

const CommentSheet: React.FC<CommentSheetProps> = ({
  open,
  onOpenChange,
  comments,
  user,
  onSubmit,
  sending,
}) => {
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-cosmic-900 border-cosmic-700 text-gray-100 rounded-t-xl"
      >
        <SheetHeader>
          <SheetTitle className="text-gray-100">
            {t("All Comments", "所有评论")} ({comments.length})
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4 max-h-[calc(85vh-220px)] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <CommentItem key={`sheet-comment-${comment.id}`} comment={comment} />
            ))}
          </AnimatePresence>
        </div>

        {user && (
          <div className="sticky bottom-0 pt-4 mt-4 border-t border-cosmic-700/30 bg-cosmic-900">
            <CommentInput
              onSubmit={onSubmit}
              sending={sending}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CommentSheet;
