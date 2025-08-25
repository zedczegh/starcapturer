
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export const useCreatorProfile = (userId: string | undefined) => {
  // Creator profile query
  const { data: creatorProfile, isLoading: loadingCreator, refetch } = useQuery({
    queryKey: ['creatorProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: userId });
      if (error) {
        console.error("Error fetching creator profile:", error);
        return null;
      }
      return data?.[0] || null;
    },
    enabled: !!userId
  });

  return { creatorProfile, loadingCreator, refetch };
};

export default useCreatorProfile;
