
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
    
    console.log("=== CREATE COMMENT DEBUG ===");
    console.log(`Creating comment for user: ${userId}, spot: ${spotId}, parent: ${parentId || 'none'}`);
    console.log("Content:", content);
    console.log("Image URLs received:", imageUrls);
    
    const commentData = {
      user_id: userId,
      spot_id: spotId,
      content: content.trim(),
      image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null, // backward compatibility
      image_urls: imageUrls || null,
      parent_id: parentId || null
    };
    
    console.log("Comment data to insert:", commentData);
    
    const { error: insertError } = await supabase
      .from("astro_spot_comments")
      .insert(commentData);
    
    if (insertError) {
      console.error("Error posting comment:", insertError);
      return false;
    }
    
    console.log("Comment created successfully");
    console.log("=== CREATE COMMENT DEBUG END ===");
    return true;
  } catch (err) {
    console.error("Exception in createComment:", err);
    return false;
  }
};
