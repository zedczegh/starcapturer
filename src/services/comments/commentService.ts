
import { supabase } from "@/integrations/supabase/client";
import { Comment } from '@/components/astro-spots/profile/types/comments';

/**
 * Fetches comments for a specific astro spot
 */
export const fetchComments = async (spotId: string): Promise<Comment[]> => {
  try {
    console.log("Fetching comments for spot ID:", spotId);
    
    // Fetch all comments for the spot - Changed query to avoid join issues
    const { data: commentsData, error: commentsError } = await supabase
      .from("astro_spot_comments")
      .select(`
        id,
        content,
        created_at,
        image_url,
        image_urls,
        user_id,
        parent_id
      `)
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      throw commentsError;
    }
    
    if (!commentsData || commentsData.length === 0) {
      console.log("No comments found for spot:", spotId);
      return [];
    }
    
    console.log(`Found ${commentsData.length} comments for spot:`, spotId);
    
    // We need to fetch user profiles separately
    const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .rpc('get_public_profiles', { p_user_ids: userIds });
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }
    
    // Create a map of profiles for easier lookup
    const profilesMap = (profilesData || []).reduce((map, profile) => {
      map[profile.id] = profile;
      return map;
    }, {} as Record<string, any>);
    
    // Transform the data to match our Comment type
    const allComments = commentsData.map((comment: any) => {
      console.log("=== FETCH COMMENT DEBUG ===");
      console.log("Raw comment data:", comment);
      console.log("Image URL:", comment.image_url);
      console.log("Image URLs:", comment.image_urls);
      
      const transformedComment = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        image_url: comment.image_url || (comment.image_urls && comment.image_urls.length > 0 ? comment.image_urls[0] : null),
        image_urls: comment.image_urls || null,
        parent_id: comment.parent_id,
        user_id: comment.user_id, // Include user_id for ownership checks
        profiles: profilesMap[comment.user_id] || { username: null, avatar_url: null },
        replies: [] // Initialize empty replies array for each comment
      };
      
      console.log("Transformed comment:", transformedComment);
      console.log("=== FETCH COMMENT DEBUG END ===");
      return transformedComment;
    });
    
    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(comment => !comment.parent_id);
    const replies = allComments.filter(comment => comment.parent_id);
    
    // Attach replies to their parent comments
    topLevelComments.forEach(comment => {
      // Sort replies by creation date (oldest first)
      comment.replies = replies
        .filter(reply => reply.parent_id === comment.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    
    console.log(`Processed ${topLevelComments.length} top-level comments with ${replies.length} replies`);
    return topLevelComments;
  } catch (error) {
    console.error("Error in fetchComments:", error);
    return [];
  }
};

/**
 * Creates a new comment for an astro spot
 */
export const createComment = async (
  userId: string,
  spotId: string,
  content: string,
  imageUrls: string[] | null,
  parentId?: string | null
): Promise<boolean> => {
  try {
    // Allow image-only comments; require either text or at least one image
    if (!content.trim() && (!imageUrls || imageUrls.length === 0)) {
      console.error("Comment must have text or at least one image");
      return false;
    }
    
    console.log("=== DATABASE SAVE TRACE ===");
    console.log("1. createComment called with:");
    console.log("   - userId:", userId);
    console.log("   - spotId:", spotId);
    console.log("   - content:", content);
    console.log("   - imageUrls:", imageUrls);
    console.log("   - imageUrls type:", typeof imageUrls);
    console.log("   - imageUrls length:", imageUrls?.length);
    console.log("   - parentId:", parentId);
    
    const commentData = {
      user_id: userId,
      spot_id: spotId,
      content: content.trim(),
      image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null, // backward compatibility
      image_urls: imageUrls, // Direct assignment - let Supabase handle it
      parent_id: parentId || null
    };
    
    console.log("2. Comment data prepared for database:");
    console.log("   - Full commentData object:", JSON.stringify(commentData, null, 2));
    console.log("   - image_urls field specifically:", commentData.image_urls);
    
    const { data: insertResult, error: insertError } = await supabase
      .from("astro_spot_comments")
      .insert(commentData)
      .select(); // Get the inserted data back to verify
    
    console.log("3. Database insert result:");
    console.log("   - insertResult:", insertResult);
    console.log("   - insertError:", insertError);
    
    if (insertError) {
      console.error("   - FAILED: Database insert error:", insertError);
      console.error("   - Error code:", insertError.code);
      console.error("   - Error message:", insertError.message);
      console.error("   - Error details:", insertError.details);
      return false;
    }
    
    if (insertResult && insertResult[0]) {
      console.log("4. SUCCESS: Comment saved to database");
      console.log("   - Saved comment ID:", insertResult[0].id);
      console.log("   - Saved image_urls:", insertResult[0].image_urls);
      console.log("   - Saved image_url:", insertResult[0].image_url);
    }
    
    console.log("=== DATABASE SAVE TRACE END ===");
    return true;
  } catch (err) {
    console.error("=== DATABASE SAVE EXCEPTION ===");
    console.error("Exception in createComment:", err);
    console.error("Exception stack:", err instanceof Error ? err.stack : 'No stack');
    return false;
  }
};

/**
 * Deletes a comment
 */
export const deleteComment = async (commentId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Deleting comment ${commentId} for user ${userId}`);
    
    const { error } = await supabase
      .from("astro_spot_comments")
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure user can only delete their own comments
    
    if (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
    
    console.log("Comment deleted successfully");
    return true;
  } catch (err) {
    console.error("Exception in deleteComment:", err);
    return false;
  }
};
