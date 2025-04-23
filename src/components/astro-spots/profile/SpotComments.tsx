
import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [commentInput, setCommentInput] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  // Update local comments when props change
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const getUsername = (comment: Comment) => {
    if (!comment || !comment.profiles) return t("Anonymous", "匿名用户");
    if (typeof comment.profiles === 'object') {
      return comment.profiles.username || t("Anonymous", "匿名用户");
    }
    return t("Anonymous", "匿名用户");
  };

  const handleCommentSubmit = async () => {
    if (!user || !spotId || !commentInput.trim()) return;
    
    setCommentSending(true);
    
    try {
      // Insert the comment
      const { error, data } = await supabase
        .from("astro_spot_comments")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          spot_id: spotId,
          content: commentInput.trim(),
        })
        .select();
      
      if (error) {
        console.error("Error posting comment:", error);
        toast.error(t("Failed to post comment.", "评论发送失败。"));
        return;
      }
      
      // Add the new comment to local state immediately
      if (data && data.length > 0) {
        const newComment = {
          ...data[0],
          profiles: {
            username: (await supabase.auth.getUser()).data.user?.email?.split('@')[0] || t("Anonymous", "匿名用户"),
            avatar_url: null
          }
        };
        setLocalComments(prev => [newComment, ...prev]);
      }
      
      // Clear input and trigger a refresh of comments
      setCommentInput("");
      toast.success(t("Comment posted!", "评论已发表！"));
      onCommentsUpdate();
      
    } catch (err) {
      console.error("Exception when posting comment:", err);
      toast.error(t("Failed to post comment.", "评论发送失败。"));
    } finally {
      setCommentSending(false);
    }
  };

  // Use the local comments state instead of the prop
  const commentsToDisplay = localComments || [];

  if (!commentsToDisplay || commentsToDisplay.length === 0) {
    return (
      <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30 flex flex-col items-center justify-center text-center">
        <MessageCircle className="h-10 w-10 text-gray-500 mb-2" />
        <p className="text-gray-400">{t("No comments yet", "暂无评论")}</p>
        
        {user && (
          <div className="mt-4 pt-4 border-t border-cosmic-700/30 w-full">
            <h3 className="text-sm font-medium text-gray-300 mb-2 text-left">
              {t("Be the first to comment", "成为第一个评论的人")}
            </h3>
            <div className="space-y-3">
              <Textarea
                placeholder={t("Write your comment here...", "在此处写下您的评论...")}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="bg-cosmic-900/40 border-cosmic-700/30 text-gray-300 resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleCommentSubmit}
                  disabled={commentSending || !commentInput.trim()}
                  size="sm"
                >
                  {commentSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Posting...", "发布中...")}
                    </>
                  ) : (
                    t("Post Comment", "发布评论")
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-primary/80" />
          {t("Comments", "评论")} ({commentsToDisplay.length})
        </h2>
        
        <Button 
          variant="ghost" 
          onClick={() => setShowCommentsSheet(true)}
          className="text-sm text-primary hover:bg-cosmic-700/30"
        >
          {t("View All", "查看全部")}
        </Button>
      </div>
      
      <div className="space-y-3">
        {commentsToDisplay.slice(0, 2).map((comment) => (
          <div 
            key={comment.id}
            className="p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-600/20"
          >
            <div className="flex items-center mb-2">
              <div className="font-medium text-gray-200">
                {getUsername(comment)}
              </div>
              <span className="text-gray-500 text-sm ml-2">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-300">{comment.content}</p>
          </div>
        ))}
      </div>
      
      {user && (
        <div className="mt-4 border-t border-cosmic-700/30 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            {t("Add a comment", "添加评论")}
          </h3>
          <div className="space-y-3">
            <Textarea
              placeholder={t("Write your comment here...", "在此处写下您的评论...")}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="bg-cosmic-900/40 border-cosmic-700/30 text-gray-300 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCommentSubmit}
                disabled={commentSending || !commentInput.trim()}
                size="sm"
              >
                {commentSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Posting...", "发布中...")}
                  </>
                ) : (
                  t("Post Comment", "发布评论")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[85vh] bg-cosmic-900 border-cosmic-700 text-gray-100 rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-gray-100">
              {t("All Comments", "所有评论")} ({commentsToDisplay.length})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-1">
            {commentsToDisplay.map((comment) => (
              <div 
                key={`sheet-comment-${comment.id}`}
                className="p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-600/20"
              >
                <div className="flex items-center mb-2">
                  <div className="font-medium text-gray-200">
                    {getUsername(comment)}
                  </div>
                  <span className="text-gray-500 text-sm ml-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SpotComments;
