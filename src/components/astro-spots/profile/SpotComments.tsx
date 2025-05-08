
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
import { v4 as uuidv4 } from 'uuid';

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

  const handleCommentSubmit = async (content: string, imageFile: File | null = null) => {
    if (!user || !spotId || (!content.trim() && !imageFile)) return;
    
    setCommentSending(true);
    
    try {
      let imageUrl: string | null = null;
      
      // If there's an image file, upload it first
      if (imageFile) {
        // Create a simple filename without special characters
        const fileExt = imageFile.name.split('.').pop() || '';
        const fileName = `${uuidv4()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('comment_images')
          .upload(fileName, imageFile, {
            contentType: imageFile.type,
            cacheControl: '3600'
          });
          
        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.error(t("Failed to upload image", "图片上传失败"));
          setCommentSending(false);
          return;
        }
        
        // Get the public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('comment_images')
          .getPublicUrl(fileName);
          
        if (publicUrlData) {
          imageUrl = publicUrlData.publicUrl;
        }
      }
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
        setCommentSending(false);
        return;
      }
      
      // Now insert the comment with the image URL if available
      const { error, data } = await supabase
        .from("astro_spot_comments")
        .insert({
          user_id: userId,
          spot_id: spotId,
          content: content.trim() || " ", // Use a space if only image is submitted
          image_url: imageUrl
        });
      
      if (error) {
        console.error("Error posting comment:", error);
        toast.error(t("Failed to post comment.", "评论发送失败。"));
        setCommentSending(false);
        return;
      }
      
      // Fetch the newly created comment with profile data
      const { data: newCommentData, error: fetchError } = await supabase
        .from("astro_spot_comments")
        .select(`
          id,
          content,
          created_at,
          image_url,
          user_id,
          profiles:user_id(username, avatar_url)
        `)
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError || !newCommentData || newCommentData.length === 0) {
        console.error("Error fetching new comment:", fetchError);
        toast.error(t("Comment posted but couldn't refresh.", "评论已发表但无法刷新。"));
      } else {
        const newComment = newCommentData[0] as unknown as Comment;
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
