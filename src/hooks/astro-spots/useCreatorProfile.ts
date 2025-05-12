
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export const useCreatorProfile = (userId: string | undefined) => {
  // Creator profile query
  const { data: creatorProfile, isLoading: loadingCreator, refetch } = useQuery({
    queryKey: ['creatorProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error("Error fetching creator profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!userId
  });

  return { creatorProfile, loadingCreator, refetch };
};

export default useCreatorProfile;
