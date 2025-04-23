
import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from 'framer-motion';
import CommentItem from './comments/CommentItem';
import CommentInput from './comments/CommentInput';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-primary/80" />
          {t("Comments", "评论")} ({localComments.length})
        </h2>
        
        {localComments.length > 2 && (
          <Button 
            variant="ghost" 
            onClick={() => setShowCommentsSheet(true)}
            className="text-sm text-primary hover:bg-cosmic-700/30"
          >
            {t("View All", "查看全部")}
          </Button>
        )}
      </div>
      
      <AnimatePresence mode="popLayout">
        {localComments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <MessageCircle className="h-10 w-10 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">{t("No comments yet", "暂无评论")}</p>
          </motion.div>
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

      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] bg-cosmic-900 border-cosmic-700 text-gray-100 rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle className="text-gray-100">
              {t("All Comments", "所有评论")} ({localComments.length})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 max-h-[calc(85vh-220px)] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {localComments.map((comment) => (
                <CommentItem key={`sheet-comment-${comment.id}`} comment={comment} />
              ))}
            </AnimatePresence>
          </div>

          {user && (
            <div className="sticky bottom-0 pt-4 mt-4 border-t border-cosmic-700/30 bg-cosmic-900">
              <CommentInput
                onSubmit={handleCommentSubmit}
                sending={commentSending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SpotComments;
