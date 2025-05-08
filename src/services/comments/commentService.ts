
import { supabase } from "@/integrations/supabase/client";
import { Comment } from '@/components/astro-spots/profile/types/comments';

/**
 * Fetches comments for a specific astro spot
 */
export const fetchComments = async (spotId: string): Promise<Comment[]> => {
  try {
    console.log("Fetching comments for spot ID:", spotId);
    
    // Fetch all comments for the spot
    const { data, error } = await supabase
      .from("astro_spot_comments")
      .select(`
        id,
        content,
        created_at,
        image_url,
        user_id,
        parent_id,
        profiles:user_id(id, username, avatar_url)
      `)
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
    
    // Transform the data to match our Comment type
    const allComments = data.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      image_url: comment.image_url,
      parent_id: comment.parent_id,
      profiles: comment.profiles || { username: null, avatar_url: null },
      replies: [] // Initialize empty replies array for each comment
    }));
    
    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(comment => !comment.parent_id);
    const replies = allComments.filter(comment => comment.parent_id);
    
    // Attach replies to their parent comments
    topLevelComments.forEach(comment => {
      comment.replies = replies
        .filter(reply => reply.parent_id === comment.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    
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
  imageUrl: string | null,
  parentId?: string | null
): Promise<boolean> => {
  try {
    console.log("Creating comment for user:", userId, "spot:", spotId);
    
    const { error: insertError } = await supabase
      .from("astro_spot_comments")
      .insert({
        user_id: userId,
        spot_id: spotId,
        content: content.trim() || " ", // Use a space if only image is submitted
        image_url: imageUrl,
        parent_id: parentId || null
      });
    
    if (insertError) {
      console.error("Error posting comment:", insertError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception in createComment:", err);
    return false;
  }
};
