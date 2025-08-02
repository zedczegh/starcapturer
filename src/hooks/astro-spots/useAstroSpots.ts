
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { SharedAstroSpot } from "@/types/weather";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export const useAstroSpots = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);

  const { data: spots, isLoading, refetch } = useQuery({
    queryKey: ['userAstroSpots', user?.id], // Include user ID in query key
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      console.log('Fetching AstroSpots for user:', user.id);
      
      let query = supabase
        .from('user_astro_spots')
        .select('*')
        .eq('user_id', user.id);
      
      // Only hide rejected spots for regular users, admins can see all their spots
      if (!isAdmin) {
        query = query.neq('verification_status', 'rejected');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(spot => ({
        id: spot.id,
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
        bortleScale: spot.bortlescale || 4,
        description: spot.description,
        siqs: spot.siqs,
        timestamp: spot.created_at,
        user_id: spot.user_id,
        verification_status: spot.verification_status
      })) as SharedAstroSpot[];
    },
    enabled: !!user && isAdmin !== null,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data to prevent cached data issues
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const handleDelete = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .delete()
        .eq('id', spotId);
      
      if (error) throw error;
      
      toast.success(t("AstroSpot deleted successfully", "观星点删除成功"));
      
      // Invalidate and refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['userAstroSpots', user?.id] });
      refetch();
    } catch (error) {
      console.error('Error deleting astro spot:', error);
      toast.error(t("Failed to delete AstroSpot", "删除观星点失败"));
    }
  };
  
  const handleSiqsCalculated = (spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
  };

  return {
    spots,
    isLoading,
    editMode,
    setEditMode,
    handleDelete,
    realTimeSiqs,
    loadingSiqs,
    handleSiqsCalculated,
    refetch
  };
};
