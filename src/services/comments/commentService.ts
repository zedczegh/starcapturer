
import { supabase } from "@/integrations/supabase/client";
import { Comment } from '@/components/astro-spots/profile/types/comments';

/**
 * Fetches comments for a specific astro spot
 */
export const fetchComments = async (spotId: string): Promise<Comment[]> => {
  try {
    console.log("Fetching comments for spot ID:", spotId);
    
    const { data, error } = await supabase
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

    if (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
    
    return data.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      image_url: comment.image_url,
      profiles: comment.profiles || { username: null, avatar_url: null }
    }));
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
  imageUrl: string | null
): Promise<boolean> => {
  try {
    console.log("Creating comment for user:", userId, "spot:", spotId);
    
    const { error: insertError } = await supabase
      .from("astro_spot_comments")
      .insert({
        user_id: userId,
        spot_id: spotId,
        content: content.trim() || " ", // Use a space if only image is submitted
        image_url: imageUrl
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
