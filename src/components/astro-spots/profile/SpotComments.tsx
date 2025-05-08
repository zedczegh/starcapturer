
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

  // Create comment bucket if it doesn't exist
  const ensureCommentBucket = async () => {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket('comment_images', {
          public: true
        });
        
        if (error) {
          console.error("Error creating comment_images bucket:", error);
          return false;
        }
        console.log("Created comment_images bucket");
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      return false;
    }
  };

  const handleCommentSubmit = async (content: string, imageFile: File | null = null) => {
    if (!user || !spotId || (!content.trim() && !imageFile)) return;
    
    setCommentSending(true);
    
    try {
      let imageUrl: string | null = null;
      
      // If there's an image file, upload it first
      if (imageFile) {
        // Ensure bucket exists
        const bucketReady = await ensureCommentBucket();
        if (!bucketReady) {
          toast.error(t("Failed to prepare storage", "存储准备失败"));
          setCommentSending(false);
          return;
        }
        
        // Create a simple filename (avoid using uuid directly as filename)
        const uniqueId = uuidv4();
        const fileExt = imageFile.name.split('.').pop() || '';
        const fileName = `${uniqueId}.${fileExt}`;
        
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
      const { error } = await supabase
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
      
      // After successful insertion, fetch all comments to refresh the list
      const { data: refreshedComments, error: fetchError } = await supabase
        .from("astro_spot_comments")
        .select(`
          id,
          content,
          created_at,
          image_url,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false });
        
      if (fetchError) {
        console.error("Error fetching comments:", fetchError);
        toast.error(t("Comment posted but couldn't refresh the list", "评论已发表但无法刷新列表"));
      } else if (refreshedComments) {
        const typedComments = refreshedComments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          image_url: comment.image_url,
          profiles: comment.profiles || { username: null, avatar_url: null }
        })) as Comment[];
        
        setLocalComments(typedComments);
        toast.success(t("Comment posted!", "评论已发表！"));
      }
    } catch (err) {
      console.error("Exception when posting comment:", err);
      toast.error(t("Failed to post comment.", "评论发送失败。"));
    } finally {
      setCommentSending(false);
      // Always call onCommentsUpdate to trigger a refresh from parent
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
