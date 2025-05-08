
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CommentItem from './comments/CommentItem';
import CommentInput from './comments/CommentInput';
import CommentHeader from './comments/CommentHeader';
import EmptyComments from './comments/EmptyComments';
import CommentSheet from './comments/CommentSheet';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Comment } from './types/comments';

interface SpotCommentsProps {
  spotId: string;
  comments: Comment[];
  user: boolean;
  onCommentsUpdate: () => void;
  onSubmit?: (content: string, imageFile: File | null, parentId?: string | null) => Promise<void>;
  sending: boolean;
}

const SpotComments: React.FC<SpotCommentsProps> = ({
  spotId,
  comments,
  user,
  onCommentsUpdate,
  onSubmit,
  sending
}) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  // Update local comments when props change
  useEffect(() => {
    console.log(`SpotComments received ${comments.length} comments`);
    setLocalComments(comments);
  }, [comments]);

  const handleCommentSubmit = async (content: string, imageFile: File | null = null) => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return;
    }

    if (onSubmit) {
      console.log("Submitting new comment");
      await onSubmit(content, imageFile);
      // Make sure we refresh comments after submission
      onCommentsUpdate();
    }
  };

  const handleReplySubmit = async (content: string, imageFile: File | null, parentId: string) => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return;
    }

    if (onSubmit) {
      console.log(`Submitting reply to comment: ${parentId}`);
      // Pass the parent ID parameter
      await onSubmit(content, imageFile, parentId);
      onCommentsUpdate();
    }
  };

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <CommentHeader 
        commentCount={localComments.length}
        onViewAll={() => setShowCommentsSheet(true)}
        showViewAll={localComments.length > 2}
      />
      
      <AnimatePresence mode="popLayout">
        {localComments.length === 0 ? (
          <EmptyComments />
        ) : (
          <motion.div layout className="space-y-6 mt-4">
            {localComments.slice(0, 2).map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                onReply={handleReplySubmit}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {user && (
        <div className="mt-4 pt-4 border-t border-cosmic-700/30">
          <CommentInput
            onSubmit={handleCommentSubmit}
            sending={sending}
          />
        </div>
      )}

      <CommentSheet
        open={showCommentsSheet}
        onOpenChange={setShowCommentsSheet}
        comments={localComments}
        user={user}
        onSubmit={handleCommentSubmit}
        onReply={handleReplySubmit}
        sending={sending}
      />
    </div>
  );
};

export default SpotComments;
