
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CommentItem from './comments/CommentItem';
import CommentInput from './comments/CommentInput';
import CommentHeader from './comments/CommentHeader';
import EmptyComments from './comments/EmptyComments';
import CommentSheet from './comments/CommentSheet';
import { useLanguage } from "@/contexts/LanguageContext";
import { Comment } from './types/comments';

interface SpotCommentsProps {
  spotId: string;
  comments: Comment[];
  user: boolean;
  onCommentsUpdate: () => void;
  onSubmit?: (content: string, imageFile: File | null) => void;
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
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleCommentSubmit = async (content: string, imageFile: File | null = null) => {
    if (onSubmit) {
      await onSubmit(content, imageFile);
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
          <motion.div layout className="space-y-3">
            {localComments.slice(0, 2).map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
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
        sending={sending}
      />
    </div>
  );
};

export default SpotComments;
