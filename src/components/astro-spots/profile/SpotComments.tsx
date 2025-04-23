
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CommentItem from './comments/CommentItem';
import CommentInput from './comments/CommentInput';
import CommentHeader from './comments/CommentHeader';
import EmptyComments from './comments/EmptyComments';
import CommentSheet from './comments/CommentSheet';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Comment } from './types/comments';

interface SpotCommentsProps {
  spotId: string;
  comments: Comment[];
  user: boolean;
  onCommentsUpdate: () => void;
}

const SpotComments: React.FC<SpotCommentsProps> = ({
  spotId,
  comments,
  user,
  onCommentsUpdate
}) => {
  const { t } = useLanguage();
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleCommentSubmit = async (content: string) => {
    if (!user || !spotId || !content.trim()) return;
    
    setCommentSending(true);
    
    try {
      const { error, data } = await supabase
        .from("astro_spot_comments")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          spot_id: spotId,
          content: content.trim(),
        })
        .select();
      
      if (error) {
        console.error("Error posting comment:", error);
        toast.error(t("Failed to post comment.", "评论发送失败。"));
        return;
      }
      
      if (data && data.length > 0) {
        const userResponse = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', userResponse.data.user?.id)
          .single();
          
        const newComment = {
          ...data[0],
          profiles: {
            username: profileData?.username || userResponse.data.user?.email?.split('@')[0] || t("Anonymous", "匿名用户"),
            avatar_url: profileData?.avatar_url
          }
        };
        
        setLocalComments(prev => [newComment, ...prev]);
        toast.success(t("Comment posted!", "评论已发表！"));
      }
      
      setTimeout(() => {
        onCommentsUpdate();
      }, 500);
      
    } catch (err) {
      console.error("Exception when posting comment:", err);
      toast.error(t("Failed to post comment.", "评论发送失败。"));
    } finally {
      setCommentSending(false);
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
            sending={commentSending}
          />
        </div>
      )}

      <CommentSheet
        open={showCommentsSheet}
        onOpenChange={setShowCommentsSheet}
        comments={localComments}
        user={user}
        onSubmit={handleCommentSubmit}
        sending={commentSending}
      />
    </div>
  );
};

export default SpotComments;
