import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReactionType = 'like' | 'heart' | 'smile' | 'reply';

export function useMessageReactions() {
  const [loading, setLoading] = useState(false);

  const addReaction = async (messageId: string, reactionType: ReactionType) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) {
        // If duplicate, remove the reaction instead
        if (error.code === '23505') {
          await removeReaction(messageId, reactionType);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    } finally {
      setLoading(false);
    }
  };

  const removeReaction = async (messageId: string, reactionType: ReactionType) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      toast.error('Failed to remove reaction');
    } finally {
      setLoading(false);
    }
  };

  const getMessageReactions = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching reactions:', error);
      return [];
    }
  };

  return {
    loading,
    addReaction,
    removeReaction,
    getMessageReactions
  };
}
